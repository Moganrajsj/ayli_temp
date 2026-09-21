import { ImageResponse } from "next/og";

export const alt = "AYLI — Women's Fashion, Elevated";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const INK = "#2A1820";
const PLUM = "#7C3048";
const PEACH = "#FF8FAA";
const BLUE = "#5B7FD4";
const GOLD = "#D4A853";
const MUTED = "#9A7480";
const SWATCHES = [PLUM, PEACH, BLUE, GOLD];

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          position: "relative",
          color: INK,
          backgroundColor: "#FFFCFD",
          backgroundImage:
            "linear-gradient(135deg, #FFFCFD 0%, #FFF0F4 55%, #FDE8EF 100%)",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            position: "absolute",
            width: 420,
            height: 420,
            borderRadius: 999,
            right: -140,
            top: -160,
            backgroundColor: PEACH,
            opacity: 0.18,
          }}
        />
        <div
          style={{
            position: "absolute",
            width: 360,
            height: 360,
            borderRadius: 999,
            left: -130,
            bottom: -170,
            backgroundColor: BLUE,
            opacity: 0.14,
          }}
        />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: "100%",
            height: "100%",
            padding: "0 88px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              paddingTop: 56,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                fontSize: 34,
                letterSpacing: "0.18em",
                fontWeight: 700,
                color: PLUM,
              }}
            >
              AYLI<span style={{ color: PEACH }}>.</span>
            </div>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              {SWATCHES.map((color) => (
                <div
                  key={color}
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 999,
                    backgroundColor: color,
                  }}
                />
              ))}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                fontSize: 96,
                lineHeight: 1.04,
                letterSpacing: "-0.03em",
                fontWeight: 700,
              }}
            >
              <span>Women&apos;s Fashion,</span>
              <span>
                Elevated<span style={{ color: PEACH }}>.</span>
              </span>
            </div>
            <div
              style={{
                width: 96,
                height: 6,
                borderRadius: 999,
                backgroundColor: PEACH,
                marginTop: 28,
              }}
            />
            <div
              style={{
                fontSize: 30,
                color: MUTED,
                marginTop: 26,
                lineHeight: 1.45,
                letterSpacing: "0.01em",
              }}
            >
              Kurtis · Co-ord sets · Dresses — crafted for the modern Indian
              woman.
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "24px 28px",
              borderTop: `1px solid ${PEACH}`,
              fontSize: 24,
              color: PLUM,
              backgroundColor: "rgba(252, 236, 241, 0.55)",
              borderRadius: 16,
            }}
          >
            <span style={{ fontWeight: 600 }}>Free shipping above ₹999</span>
            <span style={{ fontWeight: 600 }}>Easy 15-day returns</span>
            <span style={{ fontWeight: 600 }}>Ships in 24 hours</span>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}