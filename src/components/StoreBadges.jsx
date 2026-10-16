// Official-style store badges: black, white type, real marks. Same size side
// by side; they wrap together, never around other buttons.
import S from "../../styles/home.module.css";

export const APP_STORE_URL =
  "https://apps.apple.com/iq/app/pepu-%D9%BE%DB%95%D9%BE%D9%88%D9%88/id1625456812";
export const PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=io.hesta.pepu_2";

function AppleMark() {
  return (
    <svg width="22" height="27" viewBox="0 0 814 1000" aria-hidden="true" fill="#fff">
      <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76.5 0-103.7 40.8-165.9 40.8s-105.6-57-155.5-127C46.7 790.7 0 663 0 541.8c0-194.4 126.4-297.5 250.8-297.5 66.1 0 121.2 43.4 162.7 43.4 39.5 0 101.1-46 176.3-46 28.5 0 130.9 2.6 198.3 99.2zm-234-181.5c31.1-36.9 53.1-88.1 53.1-139.3 0-7.1-.6-14.3-1.9-20.1-50.6 1.9-110.8 33.7-147.1 75.8-28.5 32.4-55.1 83.6-55.1 135.5 0 7.8 1.3 15.6 1.9 18.1 3.2.6 8.4 1.3 13.6 1.3 45.4 0 102.5-30.4 135.5-71.3z" />
    </svg>
  );
}

function PlayMark() {
  return (
    <svg width="24" height="26" viewBox="0 0 24 26" aria-hidden="true">
      <path d="M1.2.6 13.6 13 1.2 25.4c-.4-.3-.7-.9-.7-1.6V2.2c0-.7.3-1.3.7-1.6z" fill="#00D7FE" />
      <path d="M17.7 8.9 13.6 13 1.2.6c.2-.2.5-.3.8-.3.3 0 .7.1 1 .3l14.7 8.3z" fill="#00F076" />
      <path d="M17.7 17.1 3 25.4c-.3.2-.7.3-1 .3-.3 0-.6-.1-.8-.3L13.6 13l4.1 4.1z" fill="#F8323C" />
      <path d="m22.6 14.6-4.9 2.5-4.1-4.1 4.1-4.1 4.9 2.6c1.2.7 1.2 2.4 0 3.1z" fill="#FFC900" />
    </svg>
  );
}

export default function StoreBadges() {
  return (
    <div className={S.stores} dir="ltr">
      <a href={APP_STORE_URL} className={S.store} aria-label="Download on the App Store">
        <AppleMark />
        <span>
          <small>Download on the</small>
          <b>App Store</b>
        </span>
      </a>
      <a href={PLAY_STORE_URL} className={S.store} aria-label="Get it on Google Play">
        <PlayMark />
        <span>
          <small>GET IT ON</small>
          <b>Google Play</b>
        </span>
      </a>
    </div>
  );
}
