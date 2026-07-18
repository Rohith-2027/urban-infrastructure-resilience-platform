import { Search, X } from "lucide-react";
import { useRef, useState } from "react";
import { focusSearchResult } from "../services/cameraService";

const SearchControl = ({ map }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const abortController = useRef(null);

  const search = async (event) => {
    event.preventDefault();
    const trimmedQuery = query.trim();

    if (!trimmedQuery) {
      return;
    }

    abortController.current?.abort();
    abortController.current = new AbortController();
    setIsSearching(true);

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&q=${encodeURIComponent(trimmedQuery)}`,
        { signal: abortController.current.signal },
      );

      if (!response.ok) {
        throw new Error("Search service request failed.");
      }

      setResults(await response.json());
    } catch (error) {
      if (error.name !== "AbortError") {
        setResults([]);
      }
    } finally {
      setIsSearching(false);
    }
  };

  const selectResult = (result) => {
    focusSearchResult(map, result);
    setQuery(result.display_name);
    setResults([]);
  };

  const clearSearch = () => {
    abortController.current?.abort();
    setQuery("");
    setResults([]);
  };

  return (
    <form className="gis-search" onSubmit={search} role="search">
      <Search size={17} aria-hidden="true" />
      <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search a place" aria-label="Search places" />
      {query && <button type="button" onClick={clearSearch} aria-label="Clear search"><X size={16} /></button>}
      <button type="submit" aria-label="Search" disabled={isSearching}><Search size={16} /></button>
      {results.length > 0 && (
        <ul className="gis-search-results">
          {results.map((result) => (
            <li key={result.place_id}>
              <button type="button" onClick={() => selectResult(result)}>{result.display_name}</button>
            </li>
          ))}
        </ul>
      )}
    </form>
  );
};

export default SearchControl;
