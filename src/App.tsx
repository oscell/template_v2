import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { SearchPage } from "./components/SearchPage";
import { ProductDetail } from "./components/ProductDetail";
import { Configure, InstantSearch } from "react-instantsearch";
import { searchClient, future, indexName } from "./lib/algolia";

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-white p-4">
        <InstantSearch
          searchClient={searchClient}
          indexName={indexName}
          future={future}
          insights
        >
          <Configure hitsPerPage={9} />
          <div className="max-w-7xl mx-auto">
            <Routes>
              <Route path="/" element={<SearchPage />} />
              <Route path="/product/:productId" element={<ProductDetail />} />
            </Routes>
          </div>
        </InstantSearch>
      </div>
    </Router>
  );
}
