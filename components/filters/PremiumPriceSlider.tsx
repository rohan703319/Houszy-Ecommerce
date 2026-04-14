"use client";


import { Range } from "react-range";

interface PremiumPriceSliderProps {
  value: [number, number];
  min: number;
  max: number;
  onChange: (value: [number, number]) => void;
}

export default function PremiumPriceSlider({
  value,
  min,
  max,
  onChange,
}: PremiumPriceSliderProps) {

  const MIN_GAP = 2;

  const handleChange = (vals: number[]) => {
    let [minVal, maxVal] = vals;

    if (maxVal - minVal < MIN_GAP) {
      if (minVal !== value[0]) {
        minVal = maxVal - MIN_GAP;
      } else {
        maxVal = minVal + MIN_GAP;
      }
    }

    onChange([minVal, maxVal]);
  };

  return (
    <div className="w-full">

      {/* Labels */}
      <div className="flex justify-between text-sm font-medium mb-2">
        <span>£{value[0]}</span>
        <span>£{value[1]}</span>
      </div>

      <Range
        values={[value[0], value[1]]}
        step={1}
        min={min}
        max={max}
        onChange={handleChange}

        renderTrack={({ props, children }) => (
          <div
            {...props}
            className="w-full h-2 bg-gray-200 rounded-full relative px-0"
          >

            <div
              className="h-2 bg-[#445D41] rounded-full absolute"
              style={{
                left: `${((value[0] - min) / (max - min)) * 100}%`,
                right: `${100 - ((value[1] - min) / (max - min)) * 100}%`,
              }}
            />

            {children}

          </div>
        )}

        renderThumb={({ props }) => {
          const { key, ...rest } = props;

          return (
            <div
              key={key}
              {...rest}
             className="h-5 w-5 bg-white border-2 border-[#445D41] rounded-full shadow-md cursor-pointer flex items-center justify-center transition hover:scale-110 active:scale-95" >
              <div className="h-2 w-2 bg-[#445D41] rounded-full" />
            </div>
          );
        }}
      />

      {/* Inputs */}
      <div className="flex items-center justify-between gap-3 mt-3">

    

 

      </div>

    </div>
  );
}