import { ImageResponse } from "next/og";

export const alt = "html2realpdf — A real PDF, not a screenshot.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "stretch",
          background: "#122445",
          color: "#fde9d3",
          display: "flex",
          fontFamily: "Tahoma, Arial, sans-serif",
          height: "100%",
          padding: 44,
          width: "100%",
        }}
      >
        <div
          style={{
            border: "3px solid #fde9d3",
            boxShadow: "10px 10px 0 #08152a",
            display: "flex",
            flexDirection: "column",
            flex: 1,
          }}
        >
          <div
            style={{
              alignItems: "center",
              background: "#f3a116",
              color: "#122445",
              display: "flex",
              fontSize: 24,
              fontWeight: 700,
              height: 56,
              justifyContent: "space-between",
              letterSpacing: 2,
              padding: "0 18px",
            }}
          >
            <span>HTML2REALPDF.EXE</span>
            <span>_ [] X</span>
          </div>
          <div
            style={{
              display: "flex",
              flex: 1,
              flexDirection: "column",
              justifyContent: "center",
              padding: "58px 70px",
            }}
          >
            <div
              style={{
                color: "#f3a116",
                display: "flex",
                fontSize: 24,
                fontWeight: 700,
                letterSpacing: 3,
                marginBottom: 20,
              }}
            >
              HTML -&gt; NATIVE PDF
            </div>
            <div
              style={{
                display: "flex",
                fontSize: 74,
                fontWeight: 700,
                letterSpacing: -3,
                lineHeight: 1.05,
              }}
            >
              A real PDF,
              <br />
              not a screenshot.
            </div>
            <div
              style={{
                display: "flex",
                fontFamily: "Courier New, monospace",
                fontSize: 27,
                marginTop: 36,
              }}
            >
              SELECTABLE / SEARCHABLE / VECTOR-BASED
            </div>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
