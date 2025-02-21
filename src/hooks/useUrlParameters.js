import React from 'react';

export default function useUrlParameters() {
  const [urlParams, setUrlParams] = React.useState({});
  const query = window.location.search;
  React.useEffect(() => {
    const searchParams = new URLSearchParams(query);
    setUrlParams(Object.fromEntries(searchParams.entries()));
  }, [query]);
  return urlParams;
}
