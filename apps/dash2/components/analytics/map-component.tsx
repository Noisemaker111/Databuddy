"use client";

import { scalePow } from "d3-scale";
import type { Feature, GeoJsonObject } from "geojson";
import type { Layer } from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useMemo, useState, useRef } from "react";
import { GeoJSON, MapContainer } from "react-leaflet";
import { useCountries, useSubdivisions } from "@/lib/geo";
import { CountryFlag } from "./icons/CountryFlag";
import { getCountryPopulation } from "@/lib/data";

interface TooltipContent {
  name: string;
  code: string;
  count: number;
  percentage: number;
  perCapita?: number;
}

interface TooltipPosition {
  x: number;
  y: number;
}

const roundToTwo = (num: number): number => {
  return Math.round((num + Number.EPSILON) * 100) / 100;
};

export function MapComponent({
  height,
  mode = "total",
  locationData,
  isLoading: passedIsLoading = false,
}: {
  height: string;
  mode?: "total" | "perCapita";
  locationData?: any;
  isLoading?: boolean;
}) {
  const locationsData = locationData;

  // Process country data from locations data
  const countryData = useMemo(() => {
    if (!locationsData?.countries) return null;
    
    // Filter out empty country codes and ensure proper formatting
    const validCountries = locationsData.countries.filter((country: any) => 
      country.country && country.country.trim() !== ""
    );
    
    const totalVisitors = validCountries.reduce((sum: number, c: any) => sum + c.visitors, 0) || 1;
    
    return {
      data: validCountries.map((country: any) => ({
        value: country.country.toUpperCase(), // Ensure uppercase for ISO matching
        count: country.visitors,
        percentage: (country.visitors / totalVisitors) * 100,
      })),
    };
  }, [locationsData?.countries]);

  const subdivisionData = useMemo(() => {
    if (!locationsData?.cities) return null;
    
    // Group cities by region
    const regions: Record<string, { visitors: number; pageviews: number }> = {};
    
    for (const city of locationsData.cities) {
      const regionKey = `${city.country}-${city.region}`;
      if (!regions[regionKey]) {
        regions[regionKey] = { visitors: 0, pageviews: 0 };
      }
      regions[regionKey].visitors += city.visitors;
      regions[regionKey].pageviews += city.pageviews;
    }
    
    return {
      data: Object.entries(regions).map(([key, data]) => ({
        value: key,
        count: data.visitors,
        percentage: (data.visitors / (locationsData.cities.reduce((sum: number, c: any) => sum + c.visitors, 0) || 1)) * 100,
      })),
    };
  }, [locationsData?.cities]);

  const [dataVersion, setDataVersion] = useState<number>(0);

  useEffect(() => {
    if (countryData || subdivisionData) {
      setDataVersion((prev) => prev + 1);
    }
  }, [countryData, subdivisionData]);

  const [tooltipContent, setTooltipContent] = useState<TooltipContent | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<TooltipPosition>({
    x: 0,
    y: 0,
  });
  const [mapView] = useState<"countries" | "subdivisions">("countries");
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Process data to include per capita metrics
  const processedCountryData = useMemo(() => {
    if (!countryData?.data) return null;

    return countryData.data.map((item: any) => {
      const population = getCountryPopulation(item.value);
      const perCapitaValue = population > 0 ? item.count / population : 0;
      return {
        ...item,
        perCapita: perCapitaValue,
      };
    });
  }, [countryData?.data]);

  const colorScale = useMemo(() => {
    if (!processedCountryData) return () => "#eee";

    // Get computed values from CSS variables
    const getComputedColor = (cssVar: string) => {
      const hslValues = getComputedStyle(document.documentElement)
        .getPropertyValue(cssVar)
        .trim();
      return `hsl(${hslValues})`;
    };

    // Get the accent-400 color
    const accentColor = getComputedColor("--accent-400");

    // Parse the HSL values to extract h, s, l components
    const hslMatch = accentColor.match(/hsl\(([^)]+)\)/);
    const hslValues = hslMatch ? hslMatch[1].split(" ") : ["0", "0%", "50%"];
    const [h, s, l] = hslValues;

    // Get the range of values
    const metricToUse = mode === "perCapita" ? "perCapita" : "count";
    const values = processedCountryData?.map((d: any) => d[metricToUse]) || [0];
    const maxValue = Math.max(...values);

    // Use a power scale with exponent 0.3
    return scalePow<string>()
      .exponent(0.3)
      .domain([0, maxValue])
      .range([`hsla(${h}, ${s}, ${l}, 0.05)`, `hsla(${h}, ${s}, ${l}, 0.9)`]);
  }, [processedCountryData, mode]);

  const { data: subdivisionsGeoData } = useSubdivisions();
  const { data: countriesGeoData } = useCountries();

  const handleStyle = (feature: Feature<any>) => {
    const dataKey = feature?.properties?.ISO_A2;
    const foundData = processedCountryData?.find(({ value }: any) => value === dataKey);

    const metricValue = mode === "perCapita" ? foundData?.perCapita || 0 : foundData?.count || 0;

    const color = metricValue > 0 
      ? colorScale(metricValue) 
      : "rgba(200, 200, 200, 0.2)";
      
    const weight = metricValue > 0 
      ? Math.min(1.5 + (metricValue / (mode === "perCapita" ? 0.05 : 5)), 3) 
      : 0.5;

    return {
      color: metricValue > 0 ? color : "rgba(180, 180, 180, 0.3)",
      weight,
      fill: true,
      fillColor: color,
      fillOpacity: hoveredId === dataKey?.toString() ? 0.9 : 0.6,
    };
  };

  const handleEachFeature = (feature: Feature<any>, layer: Layer) => {
    layer.on({
      mouseover: () => {
        const code = feature.properties?.ISO_A2;
        setHoveredId(code);

        const name = feature.properties?.ADMIN;
        const foundData = processedCountryData?.find(({ value }: any) => value === code);
        const count = foundData?.count || 0;
        const percentage = foundData?.percentage || 0;
        const perCapita = foundData?.perCapita || 0;

        setTooltipContent({
          name,
          code,
          count,
          percentage,
          perCapita,
        });
      },
      mouseout: () => {
        setHoveredId(null);
        setTooltipContent(null);
      },
      click: () => {
        // Functionality removed
      },
    });
  };

  const containerRef = useRef<HTMLDivElement>(null);
  const [resolvedHeight, setResolvedHeight] = useState<number>(0);
  
  useEffect(() => {
    const updateHeight = () => {
      if (containerRef.current) {
        setResolvedHeight(containerRef.current.clientHeight);
      }
    };
    
    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  const zoom = resolvedHeight ? Math.log2(resolvedHeight / 400) + 1 : 1;

  return (
    <div
      onMouseMove={(e) => {
        if (tooltipContent) {
          setTooltipPosition({
            x: e.clientX,
            y: e.clientY,
          });
        }
      }}
      style={{
        height: height,
      }}
      ref={containerRef}
      className="relative"
    >
      {passedIsLoading && (
        <div className="absolute inset-0 bg-neutral-900/30 backdrop-blur-sm z-10 flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <div className="h-8 w-8 rounded-full border-2 border-accent-400 border-t-transparent animate-spin" />
            <span className="text-sm text-neutral-300">
              Loading map data...
            </span>
          </div>
        </div>
      )}
      
      {(countriesGeoData || subdivisionsGeoData) && (
        <MapContainer
          preferCanvas={true}
          attributionControl={false}
          zoomControl={false}
          center={[40, 3]}
          zoom={zoom}
          style={{
            height: "100%",
            background: "none",
            cursor: "default",
            outline: "none",
            zIndex: "1",
          }}
        >
          {mapView === "countries" && countriesGeoData && (
            <GeoJSON
              key={`countries-${dataVersion}-${mode}`}
              data={countriesGeoData as GeoJsonObject}
              style={handleStyle as any}
              onEachFeature={handleEachFeature}
            />
          )}
        </MapContainer>
      )}
      {tooltipContent && (
        <div
          className="fixed z-50 bg-neutral-1000 text-white rounded-md p-2 shadow-lg text-sm pointer-events-none"
          style={{
            left: tooltipPosition.x,
            top: tooltipPosition.y - 10,
            transform: "translate(-50%, -100%)",
          }}
        >
          <div className="font-sm flex items-center gap-1">
            {tooltipContent.code && (
              <CountryFlag country={tooltipContent.code.slice(0, 2)} />
            )}
            {tooltipContent.name}
          </div>
          <div>
            <span className="font-bold text-accent-400">
              {tooltipContent.count.toLocaleString()}
            </span>{" "}
            <span className="text-neutral-300">
              ({tooltipContent.percentage.toFixed(1)}%) sessions
            </span>
          </div>
          {mode === "perCapita" && (
            <div className="text-sm text-neutral-300">
              <span className="font-bold text-accent-400">
                {roundToTwo(tooltipContent.perCapita ?? 0)}
              </span>{" "}
              per million people
            </div>
          )}
        </div>
      )}
    </div>
  );
} 