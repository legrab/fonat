import { Fragment } from 'react';
import { Coordinates, Line, Mafs, Plot, Point, Text } from 'mafs';

type PlotConfig = {
  viewport?: { x: [number, number]; y: [number, number] };
  axes?: boolean;
  points?: Array<{ x: number; y: number; label?: string }>;
  segments?: Array<{ from: [number, number]; to: [number, number]; label?: string }>;
  polynomials?: Array<{ coefficients: number[]; label?: string }>;
  trig?: Array<{
    function: 'sin' | 'cos';
    amplitude: number;
    period: number;
    phase: number;
    verticalShift: number;
    label?: string;
  }>;
};

function polynomial(coefficients: number[], x: number) {
  return coefficients.reduce((sum, coefficient, index) => sum + coefficient * x ** index, 0);
}

export function MathPlot({ config }: { config: PlotConfig }) {
  return (
    <Mafs viewBox={config.viewport ?? { x: [-5, 5], y: [-5, 5] }} preserveAspectRatio={false} height={360}>
      {config.axes !== false ? <Coordinates.Cartesian /> : null}
      {config.points?.map((point, index) => (
        <Fragment key={`point-${index}`}>
          <Point x={point.x} y={point.y} />
          {point.label ? (
            <Text x={point.x} y={point.y + 0.4}>
              {point.label}
            </Text>
          ) : null}
        </Fragment>
      ))}
      {config.segments?.map((segment, index) => (
        <Line.Segment key={`segment-${index}`} point1={segment.from} point2={segment.to} />
      ))}
      {config.polynomials?.map((item, index) => (
        <Plot.OfX key={`poly-${index}`} y={(x) => polynomial(item.coefficients, x)} />
      ))}
      {config.trig?.map((item, index) => (
        <Plot.OfX
          key={`trig-${index}`}
          y={(x) =>
            item.amplitude *
              (item.function === 'sin'
                ? Math.sin(((2 * Math.PI) / item.period) * x + item.phase)
                : Math.cos(((2 * Math.PI) / item.period) * x + item.phase)) +
            item.verticalShift
          }
        />
      ))}
    </Mafs>
  );
}
