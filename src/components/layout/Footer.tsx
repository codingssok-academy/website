"use client";

import Link from "next/link";
import Image from "next/image";

/*
  Footer — exact nodcoding site-foot pattern
  Structure:
    footer.site-foot
      div.b-separator.u-container    (thin horizontal line)
      div.u-container
        div.s__cta                   (CTA row: content + link + shape)
          div.s__cta__content        (title + text)
          div.s__cta__link           (apply/contact button)
          div.s__cta__shape          (decorative circle)
        div.s__foot                  (bottom bar: menu + copyright)
          ul.s__foot__menu           (links)
          span.s__copyright
*/

export default function Footer() {
    return (
        <footer className="site-foot" data-plr-component="site-foot">
            {/* Separator line */}
            <div
                className="b-separator u-container"
                data-plr-component="b-separator"
            >
                <div className="b__line" />
            </div>

            <div className="u-container">
                {/* CTA row */}
                <div className="s__cta">
                    <div className="s__cta__content">
                        <Image
                            src="/images/promo/logo-wide-tagline.png"
                            alt="코딩쏙 - 머리에 쏙쏙 들어오는 코딩교육"
                            width={360}
                            height={100}
                            style={{ objectFit: "contain", height: 60, width: "auto", marginBottom: 20 }}
                        />
                        <h2 className="s__cta__title t-h-2xs">
                            코딩의 시작,
                            <br />
                            코딩쏙에서.
                        </h2>
                        <div className="s__cta__text t-t-lg">
                            현직 IT 전문가의 소수 정예 코딩 교육.
                            <br />
                            코드를 직접 치며 배우는 실전 수업.
                        </div>
                    </div>

                    {/* Decorative shape */}
                    <div className="s__cta__shape" aria-hidden="true" />
                </div>

                {/* Bottom bar */}
                <div className="s__foot">
                    <ul id="menu-footer-menu" className="s__foot__menu">
                        <li>
                            <Link href="#pricing">과정</Link>
                        </li>
                        <li>
                            <Link href="#faq">FAQ</Link>
                        </li>
                        <li>
                            <Link href="#contact">상담</Link>
                        </li>
                        <li>
                            <Link href="/parent">학부모</Link>
                        </li>
                        <li>
                            <Link href="/teacher/login">선생님</Link>
                        </li>
                        <li>
                            <Link href="/trial">무료 체험</Link>
                        </li>
                        <li>
                            <a href="tel:010-7566-7229" style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                010-7566-7229
                            </a>
                        </li>
                    </ul>

                    <span className="s__copyright">
                        &copy; {new Date().getFullYear()} 코딩쏙
                    </span>
                </div>
            </div>
        </footer>
    );
}
