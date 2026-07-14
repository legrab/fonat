import { Mafs, Coordinates, Point, Polygon, Text } from "mafs";
export function MathPlotPage() {
  return (
    <>
      <div className="page-title">
        <div>
          <span className="eyebrow">Korlátozott 2D matematika renderer</span>
          <h1>Koordináta-távolság</h1>
        </div>
      </div>
      <section className="panel">
        <Mafs height={460} viewBox={{ x: [-1, 6], y: [-1, 6] }}>
          <Coordinates.Cartesian />
          <Polygon
            points={[
              [1, 1],
              [5, 1],
              [5, 4],
            ]}
          />
          <Point x={1} y={1} />
          <Point x={5} y={4} />
          <Text x={0.6} y={0.7}>
            A
          </Text>
          <Text x={5.3} y={4.2}>
            B
          </Text>
        </Mafs>
        <p>A vízszintes különbség 4, a függőleges 3, ezért a távolság 5.</p>
      </section>
    </>
  );
}
