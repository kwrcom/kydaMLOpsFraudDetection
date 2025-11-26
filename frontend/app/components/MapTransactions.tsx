"use client";

import React, { useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Prediction } from '../hooks/useRealtimePredictions';

const countryCenters: Record<string, [number, number]> = {
    US: [38.0, -97.0],
    GB: [54.0, -2.0],
    DE: [51.2, 10.45],
    FR: [46.0, 2.0],
    RU: [61.0, 85.0],
    KZ: [48.0, 68.0],
    IN: [21.0, 78.0],
    CN: [35.0, 103.0],
    BR: [-10.0, -55.0],
    NG: [9.0, 8.0],
};

function colorForRisk(p: number) {
    // gradient green -> yellow -> red
    const r = Math.round(Math.min(255, 255 * p * 2));
    const g = Math.round(Math.min(255, 255 * (1 - Math.abs(p - 0.5) * 2)));
    const b = Math.round(Math.min(255, 255 * (1 - p)));
    return `rgba(${r}, ${g}, ${b}, 0.9)`;
}

export default function MapTransactions({ preds }: { preds: Prediction[] }) {
    // take last 200 preds
    const points = preds.slice(0, 200);

    return (
        <div className="card">
            <div style={{ padding: '1rem', borderBottom: '1px solid #e6eef6' }}>
                <h3 style={{ margin: 0 }}>Global Transaction Map</h3>
            </div>
            <div style={{ height: 350, padding: '1rem' }}>
                {/* MapContainer types in this workspace cause a strict TS build error in CI/production.
                    Cast props to `any` to keep runtime behavior while avoiding a blocking type mismatch.
                    This is a narrow pragmatic fix for the build; if you prefer a stricter solution we can
                    refine the react-leaflet types or update TypeScript settings later. */}
                {(() => {
                    const mapProps: any = { center: [20, 0], zoom: 2, style: { height: '100%', width: '100%' } };
                    return (
                        <MapContainer {...mapProps}>
                            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    {points.map((p, i) => {
                        // if predictions include lat/lon use them, otherwise fallback to country center
                        let pos: [number, number] | null = null;
                        if ((p as any).lat && (p as any).lon) {
                            pos = [(p as any).lat, (p as any).lon];
                        } else if (p.country && countryCenters[p.country]) {
                            pos = countryCenters[p.country as string];
                        }
                        if (!pos) return null;

                        const col = colorForRisk(p.pred_proba ?? 0);
                        const radius = 6 + Math.round((p.pred_proba ?? 0) * 10);

                        return (
                            <CircleMarker
                                key={i}
                                center={pos}
                                pathOptions={{ color: col, fillColor: col, radius }}
                            >
                                <Popup>
                                    <div style={{ minWidth: 200 }}>
                                        <div style={{ fontWeight: 700 }}>{p.transaction_id}</div>
                                        <div style={{ fontSize: 12, color: '#64748b', marginTop: 6 }}>{p.city ?? p.country}</div>
                                        <div style={{ marginTop: 6 }}>Risk: {(p.pred_proba * 100).toFixed(1)}%</div>
                                        <div style={{ marginTop: 6 }}>Amount: ${p.amount?.toFixed?.(2)}</div>
                                    </div>
                                </Popup>
                            </CircleMarker>
                        );
                    })}
                        </MapContainer>
                    );
                })()}
            </div>
        </div>
    );
}
