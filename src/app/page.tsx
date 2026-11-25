import Link from "next/link";
import Image from "next/image";
import { CalendarCheck, CircleHelp, ClipboardCheck, Play, Search, ShoppingBag, Smartphone, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { getT } from "@/i18n/server";
import { LanguageSwitch } from "@/i18n/LanguageSwitch";
import { LandingStage } from "./landing-stage";
import { RentalGallery } from "./rental-gallery";
import { FooterKite } from "./footer-kite";
import styles from "./landing.module.css";

const workflow = [
  { key: "list", icon: Store },
  { key: "book", icon: CalendarCheck },
  { key: "deliver", icon: ClipboardCheck },
] as const;

const rentalScenes = [
  { key: "camping", image: "/kite-rental-camping.webp" },
  { key: "ceremonies", image: "/kite-rental-ceremonies.webp" },
  { key: "home", image: "/kite-rental-home.webp" },
  { key: "trek", image: "/kite-rental-trek.webp" },
  { key: "stage", image: "/kite-rental-stage.webp" },
  { key: "table", image: "/kite-rental-table.webp" },
  { key: "hosting", image: "/kite-rental-hosting.webp" },
] as const;

function getGooglePlayUrl(value: string | undefined) {
  if (!value) return;
  try {
    const url = new URL(value);
    if (url.origin === "https://play.google.com" && url.pathname === "/store/apps/details" && url.searchParams.get("id")) return url.href;
  } catch {
    return undefined;
  }
}

export default async function LandingPage() {
  const { t } = await getT();
  const googlePlayUrl = getGooglePlayUrl(process.env.KITE_ANDROID_PLAY_STORE_URL);
  const chapters = [
    {
      key: "list",
      image: "/kite-chapter-listings.webp",
      label: t("nav.listings"),
      details: [
        [t("landing.chapter.example"), t("landing.chapter.photography")],
        [t("landing.chapter.price"), t("money.etb", { amount: "8,500" }) + " · " + t("offer.perEvent")],
      ],
    },
    {
      key: "book",
      image: "/kite-chapter-bookings.webp",
      label: t("landing.chapter.bookings"),
      details: [
        [t("landing.chapter.example"), t("landing.chapter.chairs")],
        [t("landing.chapter.bookingStatus"), t("status.CONFIRMED")],
      ],
    },
    {
      key: "earn",
      image: "/kite-chapter-earnings.webp",
      label: t("landing.chapter.wallet"),
      details: [
        [t("dash.available"), t("money.etb", { amount: "12,500" })],
        [t("dash.held"), t("money.etb", { amount: "3,200" })],
      ],
    },
  ] as const;

  return (
    <div className={styles.canvas}>
      <div className={styles.frame}>
        <header className={styles.header}>
          <Link href="/" className={styles.brand}>
            <Image src="/kite-mark.png" alt="" width={28} height={28} />
            Kite
          </Link>
          <nav className={styles.nav}>
            <a href="#kite-customer-app" className={styles.customerLink}>{t("landing.app.nav")}</a>
            <LanguageSwitch className={styles.language} compact />
            <Link className={styles.signIn} href="/auth/login">{t("common.signIn")}</Link>
          </nav>
        </header>

        <main className={styles.main}>
          <div className={styles.intro}>
            <p className={styles.eyebrow}>{t("landing.badge")}</p>
            <h1>
              {t("landing.headlineStart")}{" "}
              <em>{t("landing.headlineEnd")}</em>
            </h1>
            <p className={styles.summary}>{t("landing.intro")}</p>

            <div className={styles.actions}>
              <Link className={styles.primary} href="/auth/signup">{t("landing.become")}</Link>
              <Dialog>
                <DialogTrigger asChild>
                  <button className={styles.secondary} type="button">
                    <CircleHelp size={17} aria-hidden="true" />
                    {t("landing.how")}
                  </button>
                </DialogTrigger>
                <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-auto rounded-3xl sm:p-8" showCloseButton={false}>
                  <DialogTitle className="text-xl">{t("landing.how")}</DialogTitle>
                  <DialogDescription>{t("landing.badge")}</DialogDescription>
                  <ol className="grid gap-5 py-2">
                    {workflow.map(({ key, icon: Icon }) => (
                      <li key={key} className="flex items-start gap-3">
                        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                          <Icon size={19} aria-hidden="true" />
                        </span>
                        <div>
                          <p className="font-semibold">{t(`landing.flow.${key}.title`)}</p>
                          <p className="mt-1 text-sm text-muted-foreground">{t(`landing.flow.${key}.text`)}</p>
                        </div>
                      </li>
                    ))}
                  </ol>
                  <div className="flex flex-wrap gap-2">
                    <Button asChild><Link href="/auth/signup">{t("landing.become")}</Link></Button>
                    <DialogClose asChild><Button variant="outline">{t("common.close")}</Button></DialogClose>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <section className={styles.showcase} aria-labelledby="landing-chapters">
            <LandingStage />

            <div className={styles.chapters}>
              <h2 id="landing-chapters">{t("landing.chapter.title")}</h2>
              <ol className={styles.chapterStack}>
                {chapters.map(({ key, image, label, details }, index) => (
                  <li key={key} className={styles.chapter} data-chapter>
                    <div className={styles.chapterImage}>
                      <Image src={image} alt="" fill sizes="(max-width: 680px) 92vw, 430px" />
                    </div>
                    <div className={styles.chapterContent}>
                      <div className={styles.chapterHeader}>
                        <span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                        <p>{label}</p>
                      </div>
                      <div>
                        <h3>{t(`landing.chapter.${key}.title`)}</h3>
                        <p className={styles.chapterCopy}>{t(`landing.chapter.${key}.text`)}</p>
                      </div>
                      <dl className={styles.chapterDetails}>
                        {details.map(([term, value]) => (
                          <div key={term}><dt>{term}</dt><dd>{value}</dd></div>
                        ))}
                      </dl>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </section>

          <RentalGallery
            title={t("landing.rentals.title")}
            openLabel={t("landing.rentals.open")}
            closeLabel={t("landing.rentals.close")}
            previousLabel={t("landing.rentals.previous")}
            nextLabel={t("landing.rentals.next")}
            scenes={rentalScenes.map(({ key, image }) => ({
              image,
              title: t(`landing.rentals.${key}.title`),
              label: t(`landing.rentals.${key}.label`),
              description: t(`landing.rentals.${key}.text`),
            }))}
          />

          <section id="kite-customer-app" className={styles.customerApp} aria-labelledby="kite-customer-app-title">
            <div className={styles.customerScene}>
              <span className={styles.customerWordmark} aria-hidden="true">KITE</span>

              <div className={styles.previewPhone} aria-hidden="true">
                <Image className={styles.handsetPhoto} src="/kite-app-handset.webp" alt="" fill sizes="(max-width: 700px) 70vw, 510px" />
                <div className={styles.phoneScreen}>
                  <div className={styles.phoneHeader}>
                    <Image src="/kite-mark.png" alt="" width={22} height={22} />
                    <ShoppingBag size={16} />
                  </div>
                  <p className={styles.phoneTitle}>{t("landing.app.explore")}</p>
                  <p className={styles.phoneSearch}><Search size={13} />{t("landing.app.search")}</p>
                  <div className={styles.phoneListings}>
                    <div className={styles.phoneListing}>
                      <Image src="/kite-rental-trek.webp" alt="" fill sizes="220px" />
                      <span>{t("landing.rentals.trek.title")}</span>
                    </div>
                    <div className={styles.phoneListing}>
                      <Image src="/kite-rental-table.webp" alt="" fill sizes="220px" />
                      <span>{t("landing.rentals.table.title")}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className={`${styles.customerFeature} ${styles.campingFeature}`} aria-hidden="true">
                <Image src="/kite-rental-camping.webp" alt="" width={112} height={74} />
                <span>{t("landing.rentals.camping.title")}</span>
              </div>
              <div className={`${styles.customerFeature} ${styles.eventFeature}`} aria-hidden="true">
                <Image src="/kite-rental-ceremonies.webp" alt="" width={112} height={74} />
                <span>{t("landing.rentals.ceremonies.title")}</span>
              </div>

              <div className={styles.customerCopy}>
                <p className={styles.eyebrow}>{t("landing.app.audience")}</p>
                <h2 id="kite-customer-app-title">{t("landing.app.title")} <em>{t("landing.app.titleAccent")}</em></h2>
                <p className={styles.customerDescription}>{t("landing.app.text")}</p>
              </div>

              <div className={styles.customerDownload}>
                {googlePlayUrl ? (
                  <a className={styles.playLink} href={googlePlayUrl}>
                    <Play size={19} aria-hidden="true" />{t("landing.app.install")}
                  </a>
                ) : (
                  <p className={styles.playStatus}>
                    <Smartphone size={19} aria-hidden="true" />{t("landing.app.pending")}
                  </p>
                )}
              </div>
            </div>
          </section>
        </main>

        <footer className={styles.footer}>
          <FooterKite />
          <div className={styles.footerInterior}>
            <div className={styles.footerBrand}>
              <p className={styles.footerName}>Kite</p>
              <p className={styles.footerTagline}>{t("landing.footer.tagline")}</p>
              <div className={styles.footerActions}>
                <Link className={styles.primary} href="/auth/signup">{t("landing.become")}</Link>
                <a className={styles.footerAppLink} href="#kite-customer-app">{t("landing.app.nav")}</a>
              </div>
            </div>

            <nav className={styles.footerNavigation} aria-label={t("landing.footer.navigation")}>
              <div>
                <h2>{t("landing.footer.providers")}</h2>
                <ul>
                  <li><a href="#landing-chapters">{t("landing.chapter.title")}</a></li>
                  <li><Link href="/auth/login">{t("common.signIn")}</Link></li>
                </ul>
              </div>
              <div>
                <h2>{t("landing.app.audience")}</h2>
                <ul>
                  <li><a href="#kite-rental-categories">{t("landing.rentals.title")}</a></li>
                  <li><a href="#kite-customer-app">{t("landing.app.nav")}</a></li>
                </ul>
              </div>
            </nav>
          </div>
          <div className={styles.footerBottom}>© {new Date().getFullYear()} Kite</div>
        </footer>
      </div>
    </div>
  );
}
