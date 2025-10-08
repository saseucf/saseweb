export const metadata = {
  title: {
    default: "SASE UCF",
    template: "%s | SASE UCF",
  },
  description:
    "SASE UCF — Society of Asian Scientists and Engineers at the University of Central Florida. Events, resources, programs, and ways to get involved.",
  keywords: [
    "SASE",
    "SASE UCF",
    "Society of Asian Scientists and Engineers",
    "University of Central Florida",
    "STEM",
    "student organization",
  ],
  authors: [{ name: "SASE UCF", url: "https://saseucf.org" }],
  openGraph: {
    title: "SASE UCF",
    description:
      "SASE UCF — Society of Asian Scientists and Engineers at the University of Central Florida. Events, resources, programs, and ways to get involved.",
    url:
      process.env.NEXT_PUBLIC_SITE_URL ||
      process.env.SITE_URL ||
      "http://localhost:3000",
    siteName: "SASE UCF",
    images: [
      {
        url:
          (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(
            /\/$/,
            ""
          ) + "/ucfsaselogo.png",
        width: 1200,
        height: 630,
        alt: "SASE UCF",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SASE UCF",
    description:
      "SASE UCF — Society of Asian Scientists and Engineers at the University of Central Florida.",
    images: [
      (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(
        /\/$/,
        ""
      ) + "/ucfsaselogo.png",
    ],
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
    },
  },
  icons: {
    icon: "/ucfsaselogo.png",
    apple: "/ucfsaselogo.png",
    other: [
      {
        rel: "mask-icon",
        url: "/ucfsaselogo.png",
        color: "#000000",
      },
    ],
  },
} as const;
