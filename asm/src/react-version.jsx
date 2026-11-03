import React, { useEffect } from 'react';

const RedirectComponent = () => {
  useEffect(() => {
    const lesson = window.location.pathname.split('/').slice(-2, -1)[0];
    const rootDomain = `${window.location.protocol}//${window.location.hostname}`;
    const url = `${rootDomain}/${lesson}/story.html?utm_source=Online&utm_medium=Online&utm_campaign=${lesson}&utm_id=${lesson}`;
    window.location.replace(url);
  }, []);

  return (
    <div>
      {window.location.pathname.split('/').slice(-2, -1)[0]}
    </div>
  );
};

export default RedirectComponent;
