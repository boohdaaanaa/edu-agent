import { useState } from "react";

import SearchForm from "./components/SearchForm";
import StatusPanel from "./components/StatusPanel";
import ResultPanel from "./components/ResultPanel";

function App() {
  const [status, setStatus] = useState("idle");
  const [result, setResult] = useState("");
  const [sources, setSources] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = async (topic, category) => {
    try {
      setStatus("searching");
      setResult("");
      setSources([]);

      const response = await fetch("http://127.0.0.1:8000/api/agent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          topic,
          category,
        }),
      });

      setStatus("analyzing");

      if (!response.ok) {
        throw new Error("Помилка API");
      }

      const data = await response.json();

      setResult(data.analysis || "Немає результату");
      setSources(data.sources || []);

      setSearchQuery(data.search_query || "");

      setStatus("done");
    } catch (err) {
      console.error(err);
      setResult("Помилка під час запиту до AI агента");
      setStatus("error");
    }
  };

  const reset = () => {
    setStatus("idle");
    setResult("");
    setSources([]);
    setSearchQuery("");
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0f172a",
        color: "white",
        padding: "40px",
        fontFamily: "Arial",
      }}
    >
      <h1>EduAgent AI</h1>

      <SearchForm
        onSubmit={handleSearch}
        isLoading={status === "searching" || status === "analyzing"}
      />

      <div style={{ marginTop: "20px" }}>
        <StatusPanel
          status={status}
          searchQuery={searchQuery}
          sources={sources}
        />
      </div>

      <div style={{ marginTop: "20px" }}>
        <ResultPanel
          text={result}
          isStreaming={false}
          sources={sources}
          onReset={reset}
        />
      </div>
    </div>
  );
}

export default App;