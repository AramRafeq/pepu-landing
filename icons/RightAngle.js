import classNames from "classnames";
import PropTypes from "prop-types";

const RightAngle = ({ width, height, direction }) => {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={classNames("angle-icon", `angle-icon--${direction}`)}
    >
      <path
        d="M10 16L14 12L10 8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
RightAngle.propTypes = {
  width: PropTypes.number,
  height: PropTypes.number,
  direction: PropTypes.oneOf(["right", "left", "up", "down"]),
};

RightAngle.defaultProps = {
  width: 24,
  height: 24,
  direction: "right",
};

export default RightAngle;
