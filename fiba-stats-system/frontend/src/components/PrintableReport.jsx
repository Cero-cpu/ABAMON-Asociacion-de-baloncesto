export default function PrintableReport({ partido, equipoLocal, equipoVisitante, resumen, parciales = [] }) {
    if (!partido || !resumen) return null

    const statsLocal = resumen.estadisticas?.local || []
    const statsVisitante = resumen.estadisticas?.visitante || []
    const izq = resumen.cuadro_izquierdo || {}
    const der = resumen.cuadro_derecho || {}

    const pct = (c, i) => i > 0 ? ((c / i) * 100).toFixed(1) : '0.0'

    const getScoreToInterval = (equipoId, q, i) => {
        let total = 0
        let hasData = false
        parciales.forEach(p => {
            if (p.cuarto < q || (p.cuarto === q && p.intervalo <= i)) {
                total += (equipoId === partido.local_id ? p.pts_local : p.pts_visitante)
                if (p.pts_local > 0 || p.pts_visitante > 0 || (p.cuarto === q && p.intervalo === i)) hasData = true
            }
        })
        return hasData ? total : ''
    }

    const parcialesPorCuarto = [1, 2, 3, 4].map(q => {
        const p = parciales.find(p => p.cuarto === q && p.intervalo === 2)
        return p ? `${p.pts_local}-${p.pts_visitante}` : null
    }).filter(Boolean)

    const renderStatsTable = (equipo, stats, esLocal) => {
        const t = stats.reduce((acc, j) => ({
            t2_c: acc.t2_c + (j.t2_conv || 0), t2_i: acc.t2_i + (j.t2_total || 0),
            t3_c: acc.t3_c + (j.t3_conv || 0), t3_i: acc.t3_i + (j.t3_total || 0),
            tl_c: acc.tl_c + (j.tl_conv || 0), tl_i: acc.tl_i + (j.tl_total || 0),
            ro: acc.ro + (j.rebotes_ofensivos || 0), rd: acc.rd + (j.rebotes_defensivos || 0), rt: acc.rt + (j.rebotes_totales || 0),
            as: acc.as + (j.asistencias || 0), per: acc.per + (j.perdidas || 0), rec: acc.rec + (j.recuperos || 0),
            tf: acc.tf + (j.bloqueos || 0), fc: acc.fc + (j.faltas || 0), fr: acc.fr + (j.faltas_recibidas || 0),
            mm: acc.mm + (j.mas_menos || 0), ef: acc.ef + (j.eficiencia || 0), pts: acc.pts + (j.puntos || 0)
        }), { t2_c: 0, t2_i: 0, t3_c: 0, t3_i: 0, tl_c: 0, tl_i: 0, ro: 0, rd: 0, rt: 0, as: 0, per: 0, rec: 0, tf: 0, fc: 0, fr: 0, mm: 0, ef: 0, pts: 0 })

        const tc_c = t.t2_c + t.t3_c
        const tc_i = t.t2_i + t.t3_i

        // Column widths in mm (Total 194mm)
        const CW = {
            no: '7mm',
            name: '32mm',
            min: '10mm',
            ci: '10mm',
            pct: '8mm',
            reb: '7mm',
            small: '7mm',
            plusminus: '8mm',
            ef: '8mm',
            pts: '12mm'
        }

        return (
            <div style={{ marginBottom: '2mm' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1mm' }}>
                    <span style={{ fontSize: '9px', fontWeight: '900', textTransform: 'uppercase' }}>
                        {equipo?.nombre} ({equipo?.abrev})
                    </span>
                    <span style={{ fontSize: '8px' }}>
                        Coach: <strong>{equipo?.entrenador || '_______________'}</strong> | Ast: <strong>{equipo?.asistente1 || '_______________'}</strong>
                    </span>
                </div>

                <table className="fiba-table">
                    <thead>
                        <tr>
                            <th rowSpan={2} style={{ width: CW.no }}>No</th>
                            <th rowSpan={2} style={{ width: CW.name, textAlign: 'left', paddingLeft: '2mm' }}>Player</th>
                            <th rowSpan={2} style={{ width: CW.min }}>Min</th>
                            <th colSpan={2} style={{ width: `calc(${CW.ci} + ${CW.pct})` }}>FG</th>
                            <th colSpan={2} style={{ width: `calc(${CW.ci} + ${CW.pct})` }}>2P</th>
                            <th colSpan={2} style={{ width: `calc(${CW.ci} + ${CW.pct})` }}>3P</th>
                            <th colSpan={2} style={{ width: `calc(${CW.ci} + ${CW.pct})` }}>FT</th>
                            <th colSpan={3} style={{ width: `calc(${CW.reb} * 3)` }}>Reb</th>
                            <th rowSpan={2} style={{ width: CW.small }}>AS</th>
                            <th rowSpan={2} style={{ width: CW.small }}>TO</th>
                            <th rowSpan={2} style={{ width: CW.small }}>ST</th>
                            <th rowSpan={2} style={{ width: CW.small }}>BS</th>
                            <th colSpan={2} style={{ width: `calc(${CW.small} * 2)` }}>Flt</th>
                            <th rowSpan={2} style={{ width: CW.plusminus }}>+/-</th>
                            <th rowSpan={2} style={{ width: CW.ef }}>Ef</th>
                            <th rowSpan={2} style={{ width: CW.pts, backgroundColor: '#ddd' }}>Pts</th>
                        </tr>
                        <tr>
                            <th style={{ width: CW.ci }}>C/I</th><th style={{ width: CW.pct }}>%</th>
                            <th style={{ width: CW.ci }}>C/I</th><th style={{ width: CW.pct }}>%</th>
                            <th style={{ width: CW.ci }}>C/I</th><th style={{ width: CW.pct }}>%</th>
                            <th style={{ width: CW.ci }}>C/I</th><th style={{ width: CW.pct }}>%</th>
                            <th style={{ width: CW.reb }}>O</th><th style={{ width: CW.reb }}>D</th><th style={{ width: CW.reb }}>T</th>
                            <th style={{ width: CW.small }}>C</th><th style={{ width: CW.small }}>R</th>
                        </tr>
                    </thead>
                    <tbody>
                        {stats.map((j, idx) => {
                            const esNJ = j.nj === 1 || (!j.minutos || j.minutos === '0:00') && j.puntos === 0 && j.rebotes_totales === 0
                            const tc_c = (j.t2_conv || 0) + (j.t3_conv || 0)
                            const tc_i = (j.t2_total || 0) + (j.t3_total || 0)
                            return (
                                <tr key={j.id || idx}>
                                    <td>{j.numero}{j.es_titular ? '*' : ''}</td>
                                    <td style={{ textAlign: 'left', paddingLeft: '2mm', textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden' }}>{j.nombre}</td>
                                    {esNJ ? (
                                        <>
                                            <td style={{ fontWeight: 'bold' }}>DNP</td>
                                            {Array(20).fill(null).map((_, i) => <td key={i} style={{ color: '#ccc' }}>-</td>)}
                                        </>
                                    ) : (
                                        <>
                                            <td>{j.minutos || '0:00'}</td>
                                            <td>{tc_c}/{tc_i}</td><td>{pct(tc_c, tc_i)}</td>
                                            <td>{j.t2_conv || 0}/{j.t2_total || 0}</td><td>{pct(j.t2_conv, j.t2_total)}</td>
                                            <td>{j.t3_conv || 0}/{j.t3_total || 0}</td><td>{pct(j.t3_conv, j.t3_total)}</td>
                                            <td>{j.tl_conv || 0}/{j.tl_total || 0}</td><td>{pct(j.tl_conv, j.tl_total)}</td>
                                            <td>{j.rebotes_ofensivos || 0}</td><td>{j.rebotes_defensivos || 0}</td><td style={{ fontWeight: 'bold' }}>{j.rebotes_totales || 0}</td>
                                            <td>{j.asistencias || 0}</td><td>{j.perdidas || 0}</td><td>{j.recuperos || 0}</td><td>{j.bloqueos || 0}</td>
                                            <td>{j.faltas || 0}</td><td>{j.faltas_recibidas || 0}</td>
                                            <td>{j.mas_menos || 0}</td><td>{Math.round(j.eficiencia || 0)}</td>
                                            <td style={{ fontWeight: '900', backgroundColor: '#e8e8e8' }}>{j.puntos || 0}</td>
                                        </>
                                    )}
                                </tr>
                            )
                        })}
                        <tr style={{ backgroundColor: '#eee', fontWeight: '900' }}>
                            <td colSpan={2} style={{ textAlign: 'left', paddingLeft: '2mm' }}>TOTALS</td>
                            <td>200:00</td>
                            <td>{tc_c}/{tc_i}</td><td>{pct(tc_c, tc_i)}</td>
                            <td>{t.t2_c}/{t.t2_i}</td><td>{pct(t.t2_c, t.t2_i)}</td>
                            <td>{t.t3_c}/{t.t3_i}</td><td>{pct(t.t3_c, t.t3_i)}</td>
                            <td>{t.tl_c}/{t.tl_i}</td><td>{pct(t.tl_c, t.tl_i)}</td>
                            <td>{t.ro}</td><td>{t.rd}</td><td>{t.rt}</td>
                            <td>{t.as}</td><td>{t.per}</td><td>{t.rec}</td><td>{t.tf}</td>
                            <td>{t.fc}</td><td>{t.fr}</td>
                            <td>{t.mm}</td><td>{Math.round(t.ef)}</td>
                            <td style={{ backgroundColor: '#ccc' }}>{t.pts}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        )
    }

    return (
        <div id="print-container">
            <div id="fiba-printable-report">

                {/* 1. HEADER (25mm) */}
                <div className="header" style={{ height: '25mm', borderBottom: '2px solid black', marginBottom: '2mm', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '4mm', alignItems: 'center' }}>
                        <div style={{ width: '15mm', height: '15mm', border: '1px solid black', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', fontWeight: 'bold' }}>LOGO</div>
                        <div>
                            <div style={{ fontSize: '11px', fontWeight: '900', textTransform: 'uppercase' }}>{partido.competicion || 'Liga Nacional'}</div>
                            <div style={{ fontSize: '9px', fontWeight: 'bold' }}>OFFICIAL STATISTICAL SHEET</div>
                            <div style={{ fontSize: '8px' }}>{partido.cancha} | {new Date(partido.fecha).toLocaleDateString()} | Game #{partido.id}</div>
                        </div>
                    </div>
                    <div style={{ textAlign: 'right', fontSize: '8px' }}>
                        <div>Ref: <strong>{partido.arbitro_principal}</strong></div>
                        <div>Ump: <strong>{partido.arbitro_asistente1}</strong>, <strong>{partido.arbitro_asistente2}</strong></div>
                        <div style={{ fontStyle: 'italic', marginTop: '1mm' }}>{new Date().toLocaleString()}</div>
                    </div>
                </div>

                {/* 2. SCORE (15mm) */}
                <div className="score" style={{ height: '15mm', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid black', padding: '0 4mm', backgroundColor: '#f9f9f9', marginBottom: '2mm' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6mm' }}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '9px', fontWeight: '900' }}>{equipoVisitante?.nombre}</div>
                            <div style={{ fontSize: '18px', fontWeight: '900' }}>{partido.pts_visitante}</div>
                        </div>
                        <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#999' }}>VS</div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '9px', fontWeight: '900' }}>{equipoLocal?.nombre}</div>
                            <div style={{ fontSize: '18px', fontWeight: '900' }}>{partido.pts_local}</div>
                        </div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '8px', marginBottom: '1mm' }}>Interval Scores</div>
                        <table style={{ fontSize: '7px', width: '80mm' }}>
                            <thead>
                                <tr style={{ backgroundColor: '#eee' }}>
                                    <th></th><th colSpan={2}>Q1</th><th colSpan={2}>Q2</th><th colSpan={2}>Q3</th><th colSpan={2}>Q4</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>{equipoLocal?.abrev}</td>
                                    {[1, 2, 3, 4].map(q => [1, 2].map(i => <td key={`l-${q}-${i}`}>{getScoreToInterval(partido.local_id, q, i)}</td>))}
                                </tr>
                                <tr>
                                    <td>{equipoVisitante?.abrev}</td>
                                    {[1, 2, 3, 4].map(q => [1, 2].map(i => <td key={`v-${q}-${i}`}>{getScoreToInterval(partido.visitante_id, q, i)}</td>))}
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* 3. TABLES (190mm approx remaining, but we need to fit other stuff) */}
                <div className="table-section" style={{ flex: 1 }}>
                    {renderStatsTable(equipoLocal, statsLocal, true)}
                    {renderStatsTable(equipoVisitante, statsVisitante, false)}
                </div>

                {/* 4. FOOTER / SUMMARIES (40mm) */}
                <div style={{ marginTop: '2mm', display: 'flex', gap: '4mm', borderTop: '2px solid black', paddingTop: '2mm' }}>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '8px', fontWeight: '900', borderBottom: '1px solid black', marginBottom: '1mm' }}>SCORING ANALYSIS</div>
                        <table className="fiba-table">
                            <thead><tr><th>Category</th><th>{equipoLocal?.abrev}</th><th>{equipoVisitante?.abrev}</th></tr></thead>
                            <tbody>
                                <tr><td>Points from Turnovers</td><td>{der.pts_tras_perdida?.local || 0}</td><td>{der.pts_tras_perdida?.visitante || 0}</td></tr>
                                <tr><td>Points in the Paint</td><td>{der.pts_pintura?.local || 0}</td><td>{der.pts_pintura?.visitante || 0}</td></tr>
                                <tr><td>Second Chance Points</td><td>{der.pts_segunda_oportunidad?.local || 0}</td><td>{der.pts_segunda_oportunidad?.visitante || 0}</td></tr>
                                <tr><td>Fast Break Points</td><td>{der.pts_contraataque?.local || 0}</td><td>{der.pts_contraataque?.visitante || 0}</td></tr>
                                <tr><td>Bench Points</td><td>{der.pts_banquillo?.local || 0}</td><td>{der.pts_banquillo?.visitante || 0}</td></tr>
                            </tbody>
                        </table>
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '8px', fontWeight: '900', borderBottom: '1px solid black', marginBottom: '1mm' }}>GAME HIGHLIGHTS</div>
                        <table className="fiba-table">
                            <thead><tr><th></th><th>{equipoLocal?.abrev}</th><th>{equipoVisitante?.abrev}</th></tr></thead>
                            <tbody>
                                <tr><td>Biggest Lead</td><td>{izq.mayor_ventaja?.local || 0}</td><td>{izq.mayor_ventaja?.visitante || 0}</td></tr>
                                <tr><td>Biggest Scoring Run</td><td>{izq.mayor_racha?.local || 0}</td><td>{izq.mayor_racha?.visitante || 0}</td></tr>
                                <tr><td>Lead Changes</td><td colSpan={2}>{izq.cambios_liderazgo || 0}</td></tr>
                                <tr><td>Times Tied</td><td colSpan={2}>{izq.empates || 0}</td></tr>
                                <tr><td>Time Leading</td><td>{izq.tiempo_con_ventaja?.local || '00:00'}</td><td>{izq.tiempo_con_ventaja?.visitante || '00:00'}</td></tr>
                            </tbody>
                        </table>
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '8px', fontWeight: '900', borderBottom: '1px solid black', marginBottom: '1mm' }}>SIGNATURES</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3mm', marginTop: '2mm' }}>
                            <div style={{ borderBottom: '1px solid black', height: '6mm', position: 'relative' }}>
                                <span style={{ fontSize: '6px', position: 'absolute', bottom: '-4px' }}>HEAD REFEREE</span>
                            </div>
                            <div style={{ borderBottom: '1px solid black', height: '6mm', position: 'relative' }}>
                                <span style={{ fontSize: '6px', position: 'absolute', bottom: '-4px' }}>TABLE OFFICIAL</span>
                            </div>
                            <div style={{ borderBottom: '1px solid black', height: '6mm', position: 'relative' }}>
                                <span style={{ fontSize: '6px', position: 'absolute', bottom: '-4px' }}>FIBA COMMISSIONER</span>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    )
}

