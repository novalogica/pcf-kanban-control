import * as React from 'react';

const style: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '12px',
  backgroundColor: '#efefef',
  color: '#b4b4b4',
  width: '95%',
  height: '100%'
}

const NoResults = () => {
  return ( 
    <div className='no-results-container' style={style}>
      <p>No results found</p>
    </div>
  );
}

export default NoResults;