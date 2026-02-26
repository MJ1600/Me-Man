import React from "react";

function Cell({ type, isPacman, isGhost, isFrightened, colors }) {
  let className = "cell";

  if (type === 1) className += " wall";
  if (type === 0) className += " dot";
  if (type === 2) className += " empty";
  if (type === 3) className += " power";

  const style = {};
  if (type === 1) {
    style.background = colors.wall;
    style.boxShadow = `0 0 8px ${colors.wallShadow}`;
    style.borderColor = colors.wallShadow;
  }

  return (
    <div className={className} style={style}>
      {isPacman && <div className="pacman"></div>}
      {isGhost && (
        <div className={`ghost ${isFrightened ? "frightened" : "danger"}`}>
          <div className="ghost-eyes"></div>
        </div>
      )}
    </div>
  );
}

export default Cell;