import React, { useEffect, useState } from 'react';

const buttonStyle = {
  position: 'fixed',
  right: '24px',
  bottom: '32px',
  zIndex: 9999,
  background: 'linear-gradient(135deg, #667eea, #764ba2)',
  color: 'white',
  border: 'none',
  borderRadius: '50%',
  width: '48px',
  height: '48px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: '0 4px 16px rgba(102,126,234,0.18)',
  cursor: 'pointer',
  fontSize: '2rem',
  transition: 'opacity 0.2s',
  opacity: 0.85,
};

const arrowStyle = {
  pointerEvents: 'none',
  fontSize: '2rem',
  lineHeight: 1,
};

function ScrollToButton() {
  const [show, setShow] = useState(false);
  const [atBottom, setAtBottom] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY || window.pageYOffset;
      const windowHeight = window.innerHeight;
      const docHeight = document.documentElement.scrollHeight;
      setShow(docHeight > windowHeight + 40 && (scrollY > 80 || scrollY < docHeight - windowHeight - 80));
      setAtBottom(scrollY > docHeight - windowHeight - 80);
    };
    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleClick = () => {
    if (atBottom) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });
    }
  };

  if (!show) return null;

  return (
    <button style={buttonStyle} onClick={handleClick} aria-label={atBottom ? 'Scroll to top' : 'Scroll to bottom'}>
      <span style={arrowStyle}>{atBottom ? '▲' : '▼'}</span>
    </button>
  );
}

export default ScrollToButton; 