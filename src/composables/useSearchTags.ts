import { ref } from "vue";
import axios from "axios";

export function useSearchTags() {
  const includedTags = ref([]);
  const excludedTags = ref([]);
  const includedTagSuggestions = ref([]);
  const excludedTagSuggestions = ref([]);
  const searchInputIncluded = ref("");
  const searchInputExcluded = ref("");

  let debounceIncluded = null;
  let debounceExcluded = null;

  async function fetchTagSuggestions(query) {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/api/tags/search`,
        {
          params: { term: query },
        }
      );
      return response.data.result.map((tag) => tag.name);
    } catch (error) {
      console.error("Error fetching tag suggestions", error);
      return [];
    }
  }

  async function onSearchInputIncluded(val) {
    searchInputIncluded.value = val;
    if (debounceIncluded) clearTimeout(debounceIncluded);
    if (val.trim().length < 2) {
      includedTagSuggestions.value = [];
      return;
    }
    debounceIncluded = setTimeout(async () => {
      includedTagSuggestions.value = await fetchTagSuggestions(val);
    }, 500);
  }

  async function onSearchInputExcluded(val) {
    searchInputExcluded.value = val;
    if (debounceExcluded) clearTimeout(debounceExcluded);
    if (val.trim().length < 2) {
      excludedTagSuggestions.value = [];
      return;
    }
    debounceExcluded = setTimeout(async () => {
      excludedTagSuggestions.value = await fetchTagSuggestions(val);
    }, 300);
  }

  return {
    includedTags,
    excludedTags,
    includedTagSuggestions,
    excludedTagSuggestions,
    searchInputIncluded,
    searchInputExcluded,
    onSearchInputIncluded,
    onSearchInputExcluded,
  };
}
