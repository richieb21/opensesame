from langchain_community.tools.tavily_search import TavilySearchResults

def perform_search(query):
    """
    Executes a Tavily search and returns the results.
    """
    search_tool = TavilySearchResults(include_answer=True)
    results = search_tool.invoke({"query": query})
    return [
        {
            "url": result.get("url", "No URL"),
            "content": result.get("content", "No content")
        }
        for result in results
    ]
