import { useAgent } from "./hooks/useAgent";
import SearchForm from "./components/SearchForm";
import StatusPanel from "./components/StatusPanel";
import ResultPanel from "./components/ResultPanel";

function App() {
  const { status, result, streamText, sources, searchQuery, error, run, reset } = useAgent();

  return (
    <div style={{ minHeight: "100vh", background: "#0f172a", color: "white", padding: "40px", fontFamily: "Arial" }}>
      <h1>EduAgent AI</h1>

      <SearchForm
        onSubmit={run}
        isLoading={status === "searching" || status === "analyzing"}
      />

      <div style={{ marginTop: "20px" }}>
        <StatusPanel status={status} searchQuery={searchQuery} sources={sources} />
      </div>

      <div style={{ marginTop: "20px" }}>
        <ResultPanel
          text={result || streamText}
          isStreaming={status === "analyzing"}
          sources={sources}
          onReset={reset}
        />
      </div>

      {error && <div style={{ color: "red", marginTop: "10px" }}>Помилка: {error}</div>}
    </div>
  );
}

export default App;