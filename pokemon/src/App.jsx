import { useEffect, useState } from "react";

export default function App() {
  const [pokemonList, setPokemonList] = useState([]);
  const [selected, setSelected] = useState(null);
  const [detailsCache, setDetailsCache] = useState({});
  const [loadingList, setLoadingList] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [query, setQuery] = useState("");
  const LIMIT = 151;

  useEffect(() => {
    async function fetchList() {
      setLoadingList(true);
      try {
        const res = await fetch(
          `https://pokeapi.co/api/v2/pokemon?limit=${LIMIT}`
        );
        const data = await res.json();
        const mapped = data.results.map((p, idx) => {
          const id = idx + 1;
          return { name: p.name, url: p.url, id };
        });
        setPokemonList(mapped);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingList(false);
      }
    }
    fetchList();
  }, []);

  async function loadDetails(nameOrId) {
    const key = String(nameOrId);
    if (detailsCache[key]) return detailsCache[key];
    setLoadingDetails(true);
    try {
      const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${key}`);
      if (!res.ok) throw new Error("Failed to fetch details");
      const data = await res.json();
      let species = null;
      try {
        const spRes = await fetch(data.species.url);
        species = await spRes.json();
      } catch (e) {
        console.error(e);
      }
      const combined = { ...data, species };
      setDetailsCache((prev) => ({ ...prev, [key]: combined }));
      return combined;
    } catch (err) {
      console.error(err);
      return null;
    } finally {
      setLoadingDetails(false);
    }
  }

  async function handleSelect(p) {
    setSelected(null);
    const details = await loadDetails(p.name || p.id);
    if (details) setSelected(details);
  }

  const filtered = pokemonList.filter(
    (p) => p.name.includes(query.toLowerCase()) || String(p.id).includes(query)
  );

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <header className="flex items-center justify-between p-4 bg-white shadow">
        <h1 className="text-2xl font-bold">Pokemon</h1>
        <input
          aria-label="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name or id..."
          className="px-3 py-2 border rounded-lg w-64"
        />
      </header>

      <main className="flex flex-1 flex-col md:flex-row gap-4 p-4">
        <aside className="md:w-1/3 lg:w-1/4">
          {loadingList ? (
            <div className="text-center p-4">Loading pokémon list...</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 gap-3 overflow-y-auto max-h-[80vh] pr-2">
              {filtered.map((p) => (
                <PokemonCard
                  key={p.name}
                  p={p}
                  onClick={() => handleSelect(p)}
                />
              ))}
            </div>
          )}
        </aside>

        <section className="flex-1">
          {selected ? (
            <DetailPanel
              pokemon={selected}
              loading={loadingDetails}
              onClose={() => setSelected(null)}
            />
          ) : (
            <div className="bg-white rounded-xl shadow p-6 h-full flex flex-col items-center justify-center">
              <h2 className="text-lg font-semibold">Choose a Pokémon</h2>
              <p className="text-gray-600">Click a card to see details</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function PokemonCard({ p, onClick }) {
  const sprite = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${p.id}.png`;
  const [type, setType] = useState(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${p.id}`);
        const d = await res.json();
        if (mounted && d.types && d.types[0]) setType(d.types[0].type.name);
      } catch (e) {
        console.error(e);
      }
    }
    load();
    return () => (mounted = false);
  }, [p.id]);

  const bg = type ? typeColor(type) : "bg-gray-200";

  return (
    <button
      className={`flex items-center gap-3 p-3 rounded-lg shadow hover:scale-105 transition ${bg} text-white`}
      onClick={onClick}
    >
      <img src={sprite} alt={p.name} className="w-12 h-12" loading="lazy" />
      <div>
        <div className="font-semibold capitalize">{p.name}</div>
        <div className="text-xs opacity-80">
          #{String(p.id).padStart(3, "0")}
        </div>
      </div>
    </button>
  );
}

function DetailPanel({ pokemon, onClose }) {
  if (!pokemon) return null;
  const types = pokemon.types.map((t) => t.type.name);
  const img =
    pokemon.sprites.other["official-artwork"].front_default ||
    pokemon.sprites.front_default;
  const flavor = extractEnglishFlavor(pokemon.species);

  return (
    <div className="bg-white rounded-xl shadow p-6 h-full overflow-y-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold capitalize">{pokemon.name}</h2>
          <div className="text-gray-500">
            #{String(pokemon.id).padStart(3, "0")}
          </div>
          <div className="mt-2 flex gap-2">
            {types.map((t) => (
              <span
                key={t}
                className={`px-3 py-1 rounded-full text-sm text-white ${typeColor(
                  t
                )}`}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-black">
          ✕
        </button>
      </div>

      <div className="mt-4 flex flex-col lg:flex-row gap-6">
        <div className="flex-shrink-0">
          <img
            src={img}
            alt={pokemon.name}
            className="w-64 h-64 object-contain"
          />
        </div>
        <div className="flex-1">
          <p className="mb-4 text-gray-700">
            {flavor || "No description available."}
          </p>

          <h3 className="font-semibold mb-2">Base Stats</h3>
          <div className="space-y-2">
            {pokemon.stats.map((s) => (
              <div key={s.stat.name} className="flex items-center gap-3">
                <div className="w-24 text-sm font-medium">
                  {statDisplayName(s.stat.name)}
                </div>
                <div className="flex-1 bg-gray-200 h-2 rounded-full">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ width: `${(s.base_stat / 160) * 100}%` }}
                  />
                </div>
                <div className="w-10 text-right text-sm">{s.base_stat}</div>
              </div>
            ))}
          </div>

          <div className="mt-4 space-y-1 text-sm text-gray-600">
            <div>Height: {pokemon.height / 10} m</div>
            <div>Weight: {pokemon.weight / 10} kg</div>
            <div>
              Abilities:{" "}
              {pokemon.abilities.map((a) => a.ability.name).join(", ")}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* Helpers */
function typeColor(type) {
  const colors = {
    grass: "bg-green-500",
    poison: "bg-purple-500",
    fire: "bg-red-500",
    water: "bg-blue-500",
    electric: "bg-yellow-400",
    rock: "bg-yellow-700",
    psychic: "bg-pink-500",
    ice: "bg-cyan-400",
    dragon: "bg-indigo-600",
    dark: "bg-gray-700",
    fairy: "bg-pink-300",
    normal: "bg-gray-400",
    flying: "bg-indigo-300",
    bug: "bg-lime-500",
    ghost: "bg-purple-700",
    steel: "bg-gray-500",
    fighting: "bg-orange-600",
  };
  return colors[type] || "bg-gray-400";
}

function statDisplayName(name) {
  if (name === "hp") return "HP";
  if (name === "attack") return "Attack";
  if (name === "defense") return "Defense";
  if (name === "special-attack") return "Sp. Atk";
  if (name === "special-defense") return "Sp. Def";
  if (name === "speed") return "Speed";
  return name;
}

function extractEnglishFlavor(species) {
  if (!species) return null;
  const entry = species.flavor_text_entries?.find(
    (e) => e.language.name === "en"
  );
  return entry?.flavor_text?.replace(/\n|\f/g, " ");
}
