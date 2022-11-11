import React from "react";
import Image from "next/image";
import pepu from "../assets/papu.svg";
import applestore from "../assets/appstore.svg";
import googleplay from "../assets/gplay.svg";
import { BsFacebook, BsInstagram } from "react-icons/bs";
import styles from "../../styles/Footer.module.css";

const Footer = () => {
  return (
    <div className={styles.footer}>
      <Image src={pepu} alt="Pepu Logo" className={styles.pepu__logo} />
      <span>کێشەی خوێندن چارەسەر بکە بە یەک کلیک</span>
      <div className={styles.downloads}>
        <a href="https://apps.apple.com/iq/app/pepu-%D9%BE%DB%95%D9%BE%D9%88%D9%88/id1625456812">
          <Image src={applestore} alt="Apple Store" />
        </a>
        <a href="https://play.google.com/store/apps/details?id=io.hesta.pepu">
          <Image src={googleplay} alt="Google Play" />
        </a>
      </div>

      <div className={styles.copyright}>
        <div>
          <a href="https://instagram.com/pepu.krd">
            <BsInstagram />
          </a>
          <a href="https://facebook.com/pepu.krd">
            <BsFacebook />
          </a>
        </div>
        <span>هەموو مافەکان پارێزراوە بۆ پەپوو</span>
      </div>
    </div>
  );
};

export default Footer;
