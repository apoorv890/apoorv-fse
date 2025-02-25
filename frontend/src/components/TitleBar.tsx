interface TitleBarProps {
  isPinned: boolean;
  onPinToggle: () => void;
}

const TitleBar: React.FC<TitleBarProps> = ({ isPinned, onPinToggle }) => {
  const handleMinimize = () => {
    if (window.electron) {
      window.electron.send('minimize-window');
    }
  };

  const handleClose = () => {
    if (window.electron) {
      window.electron.send('close-window');
    }
  };

  return (
    <div className="title-bar">
      <div className="drag-region" />
      <div className="window-controls">
        <button
          className={`pin-button ${isPinned ? 'pinned' : ''}`}
          onClick={onPinToggle}
        >
          📌
        </button>
        <button className="minimize-button" onClick={handleMinimize}>
          —
        </button>
        <button className="close-button" onClick={handleClose}>
          ✕
        </button>
      </div>
    </div>
  );
};

export default TitleBar;
