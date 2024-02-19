// Example function to fetch data from DBpedia (adjust query as needed)
async function fetchFromDBpedia(sparqlQuery: string) {
    const endpointUrl = 'https://dbpedia.org/sparql';
    const url = `${endpointUrl}?query=${encodeURIComponent(sparqlQuery)}&format=json`;
    const response = await fetch(url);
    return response.json(); // Parse JSON response
  }
  