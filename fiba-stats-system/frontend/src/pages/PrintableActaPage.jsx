import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getPartido, getResumenPartido, getParciales } from '../services/api'

/* ──────────────────────────────────────────
   PLANILLA ESTADÍSTICA FIBA – Print Layout
   ────────────────────────────────────────── */

const cellStyle = {
    border: '1px solid #000',
    padding: '1px 2px',
    fontSize: '8.5px',
    textAlign: 'center',
    lineHeight: '1.1',
    whiteSpace: 'nowrap',
}

const headerCellStyle = {
    ...cellStyle,
    fontWeight: 'bold',
    backgroundColor: '#e8e8e8',
    fontSize: '7.5px',
}

const subHeaderStyle = {
    ...cellStyle,
    fontWeight: 'bold',
    backgroundColor: '#f0f0f0',
    fontSize: '7px',
}

const nameCellStyle = {
    ...cellStyle,
    textAlign: 'left',
    paddingLeft: '3px',
    maxWidth: '90px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
}

export default function PrintableActaPage() {
    const [searchParams] = useSearchParams()
    const idStr = searchParams.get('id')
    const partidoId = parseInt(idStr)

    const [partido, setPartido] = useState(null)
    const [resumen, setResumen] = useState(null)
    const [parciales, setParciales] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!partidoId) return
        const loadData = async () => {
            try {
                const [pRes, rRes, parcRes] = await Promise.all([
                    getPartido(partidoId),
                    getResumenPartido(partidoId),
                    getParciales(partidoId),
                ])
                setPartido(pRes.data)
                setResumen(rRes.data)
                setParciales(parcRes.data || [])
                setLoading(false)

                // Dar tiempo extra para que React termine el ciclo de renderizado pesado
                // Subimos a 3s para garantizar que incluso en sistemas lentos los datos estén pintados
                setTimeout(() => {
                    window.print()
                }, 3000)
            } catch (err) {
                console.error(err)
                setLoading(false)
            }
        }
        loadData()
    }, [partidoId])

    if (loading) return (
        <div style={{ padding: 40, fontFamily: 'monospace', color: '#fff', backgroundColor: '#000', height: '100vh' }}>
            Cargando planilla oficial...
        </div>
    )
    if (!partido || !resumen) return (
        <div style={{ padding: 40, color: '#ff4444', backgroundColor: '#000', height: '100vh', fontFamily: 'monospace' }}>
            Error: No se pudo encontrar el partido {partidoId}.
        </div>
    )

    const eqLocal = partido.equipo_local || {}
    const eqVisit = partido.equipo_visitante || {}
    const abrevL = eqLocal.abrev || eqLocal.nombre?.substring(0, 3).toUpperCase() || 'LOC'
    const abrevV = eqVisit.abrev || eqVisit.nombre?.substring(0, 3).toUpperCase() || 'VIS'

    const evL = resumen.estadisticas?.local || []
    const evV = resumen.estadisticas?.visitante || []

    // Build quarter scores from parciales
    const quarterScores = (() => {
        const scores = { local: [0, 0, 0, 0], visitante: [0, 0, 0, 0] }
        if (parciales.length > 0) {
            parciales.forEach(p => {
                const idx = (p.cuarto || 1) - 1
                if (idx >= 0 && idx < 4) {
                    scores.local[idx] += (p.pts_local || 0)
                    scores.visitante[idx] += (p.pts_visitante || 0)
                }
            })
        }
        
        // Ajuste manual: Si el total del partido no coincide con la suma de parciales
        // (porque se editó a mano), ajustamos el último cuarto con datos para que cuadre el total.
        const sumL = scores.local.reduce((a, b) => a + b, 0)
        const sumV = scores.visitante.reduce((a, b) => a + b, 0)
        
        if (sumL !== partido.pts_local) {
            const diff = partido.pts_local - sumL
            const lastIdx = Math.max(0, (partido.cuarto_actual || 1) - 1)
            scores.local[Math.min(3, lastIdx)] += diff
        }
        if (sumV !== partido.pts_visitante) {
            const diff = partido.pts_visitante - sumV
            const lastIdx = Math.max(0, (partido.cuarto_actual || 1) - 1)
            scores.visitante[Math.min(3, lastIdx)] += diff
        }

        return scores
    })()

    // Accumulated scores per quarter (the image shows accumulated C1, C2, C3, C4)
    const accumulatedL = []
    const accumulatedV = []
    let accL = 0, accV = 0
    for (let i = 0; i < 4; i++) {
        accL += quarterScores.local[i]
        accV += quarterScores.visitante[i]
        accumulatedL.push(accL)
        accumulatedV.push(accV)
    }

    // Helper: safe percentage 
    const pct = (conv, total) => {
        if (!total || total === 0) return '0.0'
        return ((conv / total) * 100).toFixed(1)
    }

    // Calculate team totals
    const calcTotals = (players, isLocal) => {
        const t = {
            min: 0, tcConv: 0, tcTotal: 0,
            t2Conv: 0, t2Total: 0, t3Conv: 0, t3Total: 0,
            tlConv: 0, tlTotal: 0,
            ro: 0, rd: 0, rt: 0,
            as: 0, per: 0, rec: 0, tf: 0,
            fc: isLocal ? (partido.faltas_equipo_local || 0) : (partido.faltas_equipo_vis || 0), // USAR DATOS DEL PARTIDO (MANUALES)
            fr: 0, masMenos: 0, ef: 0, 
            pts: isLocal ? (partido.pts_local || 0) : (partido.pts_visitante || 0) // USAR PUNTOS OFICIALES DEL PARTIDO
        }
        players.forEach(p => {
            const mins = parseFloat(p.minutos || 0)
            t.min += mins
            t.t2Conv += (p.t2_conv || 0)
            t.t2Total += (p.t2_total || 0)
            t.t3Conv += (p.t3_conv || 0)
            t.t3Total += (p.t3_total || 0)
            t.tlConv += (p.tl_conv || 0)
            t.tlTotal += (p.tl_total || 0)
            t.ro += (p.rebotes_ofensivos || 0)
            t.rd += (p.rebotes_defensivos || 0)
            t.rt += (p.rebotes_totales || 0)
            t.as += (p.asistencias || 0)
            t.per += (p.perdidas || 0)
            t.rec += (p.recuperos || 0)
            t.tf += (p.bloqueos || 0)
            // t.fc += (p.faltas || 0) // No sumamos de jugadores para el total oficial
            t.fr += (p.faltas_recibidas || 0)
            t.masMenos += (p.mas_menos || 0)
            t.ef += (p.eficiencia || 0)
            // t.pts += (p.puntos || 0) // No sumamos de jugadores para el total oficial
        })
        t.tcConv = t.t2Conv + t.t3Conv
        t.tcTotal = t.t2Total + t.t3Total
        return t
    }

    const formatMinutes = (val) => {
        if (!val) return ''
        const num = parseFloat(val)
        if (isNaN(num)) return val
        const m = Math.floor(num)
        const s = Math.round((num - m) * 60)
        return `${m}:${String(s).padStart(2, '0')}`
    }

    // Render single player row
    const renderPlayerRow = (p, idx) => {
        if (!p) {
            return (
                <tr key={`empty-${idx}`}>
                    <td style={cellStyle}>&nbsp;</td>
                    <td style={nameCellStyle}>&nbsp;</td>
                    <td style={cellStyle}>&nbsp;</td>
                    {/* TC */}<td style={cellStyle}></td><td style={cellStyle}></td>
                    {/* 2P */}<td style={cellStyle}></td><td style={cellStyle}></td>
                    {/* 3P */}<td style={cellStyle}></td><td style={cellStyle}></td>
                    {/* TL */}<td style={cellStyle}></td><td style={cellStyle}></td>
                    {/* Reb */}<td style={cellStyle}></td><td style={cellStyle}></td><td style={cellStyle}></td>
                    {/* AS,Per,Rec,TF */}<td style={cellStyle}></td><td style={cellStyle}></td><td style={cellStyle}></td><td style={cellStyle}></td>
                    {/* Faltas */}<td style={cellStyle}></td><td style={cellStyle}></td>
                    {/* +/- Ef Pts */}<td style={cellStyle}></td><td style={cellStyle}></td><td style={cellStyle}></td>
                </tr>
            )
        }

        const tcConv = (p.t2_conv || 0) + (p.t3_conv || 0)
        const tcTotal = (p.t2_total || 0) + (p.t3_total || 0)
        const isNJ = p.nj ? true : false
        const minDisplay = isNJ ? 'NJ' : formatMinutes(p.minutos)

        return (
            <tr key={p.id || idx} style={{ backgroundColor: p.es_titular ? '#fff' : '#fafafa' }}>
                <td style={{ ...cellStyle, fontWeight: 'bold' }}>{p.es_titular ? `*${p.numero}` : p.numero}</td>
                <td style={{ ...nameCellStyle, fontWeight: p.es_titular ? 'bold' : 'normal', fontSize: '8px' }}>{p.nombre}</td>
                <td style={cellStyle}>{minDisplay}</td>
                {/* Tiros de campo */}
                <td style={cellStyle}>{isNJ ? '' : `${tcConv}/${tcTotal}`}</td>
                <td style={cellStyle}>{isNJ ? '' : pct(tcConv, tcTotal)}</td>
                {/* 2 puntos */}
                <td style={cellStyle}>{isNJ ? '' : `${p.t2_conv || 0}/${p.t2_total || 0}`}</td>
                <td style={cellStyle}>{isNJ ? '' : pct(p.t2_conv, p.t2_total)}</td>
                {/* 3 puntos */}
                <td style={cellStyle}>{isNJ ? '' : `${p.t3_conv || 0}/${p.t3_total || 0}`}</td>
                <td style={cellStyle}>{isNJ ? '' : pct(p.t3_conv, p.t3_total)}</td>
                {/* Tiros 1pt */}
                <td style={cellStyle}>{isNJ ? '' : `${p.tl_conv || 0}/${p.tl_total || 0}`}</td>
                <td style={cellStyle}>{isNJ ? '' : pct(p.tl_conv, p.tl_total)}</td>
                {/* Rebotes */}
                <td style={cellStyle}>{isNJ ? '' : (p.rebotes_ofensivos || 0)}</td>
                <td style={cellStyle}>{isNJ ? '' : (p.rebotes_defensivos || 0)}</td>
                <td style={cellStyle}>{isNJ ? '' : (p.rebotes_totales || 0)}</td>
                {/* AS */}
                <td style={cellStyle}>{isNJ ? '' : (p.asistencias || 0)}</td>
                {/* Per */}
                <td style={cellStyle}>{isNJ ? '' : (p.perdidas || 0)}</td>
                {/* Rec */}
                <td style={cellStyle}>{isNJ ? '' : (p.recuperos || 0)}</td>
                {/* TF */}
                <td style={cellStyle}>{isNJ ? '' : (p.bloqueos || 0)}</td>
                {/* Faltas */}
                <td style={cellStyle}>{isNJ ? '' : (p.faltas || 0)}</td>
                <td style={cellStyle}>{isNJ ? '' : (p.faltas_recibidas || 0)}</td>
                {/* +/- */}
                <td style={cellStyle}>{isNJ ? '' : (p.mas_menos || 0)}</td>
                {/* Ef */}
                <td style={cellStyle}>{isNJ ? '' : (p.eficiencia || 0)}</td>
                {/* Pts */}
                <td style={{ ...cellStyle, fontWeight: 'bold' }}>{isNJ ? '' : (p.puntos || 0)}</td>
            </tr>
        )
    }

    // Render team table (matches the FIBA reference)
    const renderTeamTable = (teamName, abrev, players, entrenador, asistentes, isLocal) => {
        // Separate starters and bench, sort starters first
        const starters = players.filter(p => p.es_titular)
        const bench = players.filter(p => !p.es_titular && !p.nj)
        const notPlayed = players.filter(p => p.nj)
        const sortedPlayers = [...starters, ...bench, ...notPlayed]

        const totals = calcTotals(players, isLocal)
        const timeouts = isLocal ? (partido.timeouts_local || 0) : (partido.timeouts_vis || 0)

        // Coach display
        const coachLine = entrenador || ''
        const assistLine = asistentes || ''

        return (
            <div style={{ marginBottom: '6px' }}>
                {/* Team header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '1px' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '10px', textTransform: 'uppercase', display: 'flex', gap: '15px', alignItems: 'center' }}>
                        <span>{teamName} ({abrev})</span>
                        <span style={{ fontSize: '7px', fontWeight: 'normal', border: '1px solid #000', padding: '0 4px' }}>T.O.: {timeouts}</span>
                    </div>
                    <div style={{ fontSize: '8px', textAlign: 'right' }}>
                        <span>Entrenador: {coachLine}</span>
                        {assistLine && <><br /><span>Entrenador(es) asistente(s): {assistLine}</span></>}
                    </div>
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                    <thead>
                        {/* Main header row */}
                        <tr>
                            <th style={{ ...headerCellStyle, width: '22px' }} rowSpan={2}>No</th>
                            <th style={{ ...headerCellStyle, width: '90px' }} rowSpan={2}>Nombre</th>
                            <th style={{ ...headerCellStyle, width: '32px' }} rowSpan={2}>Min</th>
                            <th style={headerCellStyle} colSpan={2}>Tiros de campo</th>
                            <th style={headerCellStyle} colSpan={2}>2 puntos</th>
                            <th style={headerCellStyle} colSpan={2}>3 puntos</th>
                            <th style={headerCellStyle} colSpan={2}>Tiros 1pt</th>
                            <th style={headerCellStyle} colSpan={3}>Rebotes</th>
                            <th style={{ ...headerCellStyle, width: '18px' }} rowSpan={2}>AS</th>
                            <th style={{ ...headerCellStyle, width: '18px' }} rowSpan={2}>Per</th>
                            <th style={{ ...headerCellStyle, width: '18px' }} rowSpan={2}>Rec</th>
                            <th style={{ ...headerCellStyle, width: '18px' }} rowSpan={2}>TF</th>
                            <th style={headerCellStyle} colSpan={2}>Faltas</th>
                            <th style={{ ...headerCellStyle, width: '22px' }} rowSpan={2}>+/-</th>
                            <th style={{ ...headerCellStyle, width: '20px' }} rowSpan={2}>Ef</th>
                            <th style={{ ...headerCellStyle, width: '22px' }} rowSpan={2}>Pts</th>
                        </tr>
                        {/* Sub header row */}
                        <tr>
                            <th style={{ ...subHeaderStyle, width: '28px' }}>CA</th>
                            <th style={{ ...subHeaderStyle, width: '28px' }}>%</th>
                            <th style={{ ...subHeaderStyle, width: '28px' }}>CA</th>
                            <th style={{ ...subHeaderStyle, width: '28px' }}>%</th>
                            <th style={{ ...subHeaderStyle, width: '28px' }}>CA</th>
                            <th style={{ ...subHeaderStyle, width: '28px' }}>%</th>
                            <th style={{ ...subHeaderStyle, width: '28px' }}>CA</th>
                            <th style={{ ...subHeaderStyle, width: '28px' }}>%</th>
                            <th style={{ ...subHeaderStyle, width: '18px' }}>RO</th>
                            <th style={{ ...subHeaderStyle, width: '18px' }}>RD</th>
                            <th style={{ ...subHeaderStyle, width: '18px' }}>RT</th>
                            <th style={{ ...subHeaderStyle, width: '20px' }}>FC</th>
                            <th style={{ ...subHeaderStyle, width: '20px' }}>FR</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedPlayers.map((p, i) => renderPlayerRow(p, i))}
                        {/* Coach row */}
                        <tr>
                            <td style={cellStyle} colSpan={2}>Equipo/Entrenador</td>
                            <td style={cellStyle}></td>
                            <td style={cellStyle}></td><td style={cellStyle}></td>
                            <td style={cellStyle}></td><td style={cellStyle}></td>
                            <td style={cellStyle}></td><td style={cellStyle}></td>
                            <td style={cellStyle}></td><td style={cellStyle}></td>
                            <td style={cellStyle}></td><td style={cellStyle}></td><td style={cellStyle}></td>
                            <td style={cellStyle}></td><td style={cellStyle}></td><td style={cellStyle}></td><td style={cellStyle}></td>
                            <td style={cellStyle}></td><td style={cellStyle}></td>
                            <td style={cellStyle}></td><td style={cellStyle}></td><td style={cellStyle}></td>
                        </tr>
                        {/* Totals row */}
                        <tr style={{ backgroundColor: '#e8e8e8', fontWeight: 'bold' }}>
                            <td style={{ ...cellStyle, fontWeight: 'bold' }} colSpan={2}>Totales</td>
                            <td style={{ ...cellStyle, fontWeight: 'bold' }}>{formatMinutes(totals.min) || '200:00'}</td>
                            <td style={{ ...cellStyle, fontWeight: 'bold' }}>{totals.tcConv}/{totals.tcTotal}</td>
                            <td style={{ ...cellStyle, fontWeight: 'bold' }}>{pct(totals.tcConv, totals.tcTotal)}</td>
                            <td style={{ ...cellStyle, fontWeight: 'bold' }}>{totals.t2Conv}/{totals.t2Total}</td>
                            <td style={{ ...cellStyle, fontWeight: 'bold' }}>{pct(totals.t2Conv, totals.t2Total)}</td>
                            <td style={{ ...cellStyle, fontWeight: 'bold' }}>{totals.t3Conv}/{totals.t3Total}</td>
                            <td style={{ ...cellStyle, fontWeight: 'bold' }}>{pct(totals.t3Conv, totals.t3Total)}</td>
                            <td style={{ ...cellStyle, fontWeight: 'bold' }}>{totals.tlConv}/{totals.tlTotal}</td>
                            <td style={{ ...cellStyle, fontWeight: 'bold' }}>{pct(totals.tlConv, totals.tlTotal)}</td>
                            <td style={{ ...cellStyle, fontWeight: 'bold' }}>{totals.ro}</td>
                            <td style={{ ...cellStyle, fontWeight: 'bold' }}>{totals.rd}</td>
                            <td style={{ ...cellStyle, fontWeight: 'bold' }}>{totals.rt}</td>
                            <td style={{ ...cellStyle, fontWeight: 'bold' }}>{totals.as}</td>
                            <td style={{ ...cellStyle, fontWeight: 'bold' }}>{totals.per}</td>
                            <td style={{ ...cellStyle, fontWeight: 'bold' }}>{totals.rec}</td>
                            <td style={{ ...cellStyle, fontWeight: 'bold' }}>{totals.tf}</td>
                            <td style={{ ...cellStyle, fontWeight: 'bold' }}>{totals.fc}</td>
                            <td style={{ ...cellStyle, fontWeight: 'bold' }}>{totals.fr}</td>
                            <td style={{ ...cellStyle, fontWeight: 'bold' }}>{totals.masMenos}</td>
                            <td style={{ ...cellStyle, fontWeight: 'bold' }}>{totals.ef}</td>
                            <td style={{ ...cellStyle, fontWeight: 'bold' }}>{totals.pts}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        )
    }

    // Bottom summary data
    const ci = resumen.cuadro_izquierdo || {}
    const cd = resumen.cuadro_derecho || {}

    const fechaObj = new Date(partido.fecha)
    const fechaStr = fechaObj.toLocaleDateString('es-DO', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })
    const horaStr = fechaObj.toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' })

    return (
        <>
            <style>{`
        @media print {
          html, body, #root { 
            margin: 0 !important; 
            padding: 0 !important; 
            background: white !important; 
            height: auto !important;
            overflow: visible !important;
            -webkit-print-color-adjust: exact !important; 
            print-color-adjust: exact !important; 
          }
          @page { 
            size: A4 portrait !important; 
            margin: 0 !important; 
          }
          * { box-sizing: border-box; }
          .no-print { display: none !important; }
          
          /* Ajuste para que el contenedor principal esté visible */
          .print-content {
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
          }
        }
        @media screen {
          body { background: #ccc; }
          .no-print { display: block; }
        }
      `}</style>

            <div className="no-print" style={{ position: 'fixed', top: 0, left: 0, width: '100%', background: '#0078D4', color: '#fff', padding: '10px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.3)', zIndex: 9999 }}>
                <span style={{ fontSize: '12px', fontWeight: 'bold', fontFamily: 'monospace' }}>VISTA PREVIA DE IMPRESIÓN OFICIAL</span>
                <button
                    onClick={() => window.print()}
                    style={{ background: '#fff', color: '#0078D4', border: 'none', padding: '6px 15px', borderRadius: '4px', fontWeight: 'black', fontSize: '11px', cursor: 'pointer', boxShadow: '0 4px 15px rgba(255,255,255,0.2)' }}
                >
                    RE-INTENTAR IMPRESIÓN
                </button>
            </div>

            <div className="print-content" style={{
                width: '210mm',
                minHeight: '297mm',
                margin: '40px auto 0 auto', // Margen superior para no solapar con el banner no-print
                backgroundColor: '#fff',
                color: '#000',
                fontFamily: 'Arial, Helvetica, sans-serif',
                fontSize: '9px',
                padding: '6mm 8mm',
                boxSizing: 'border-box',
                pageBreakAfter: 'always',
            }}>

                {/* ═══════ HEADER ═══════ */}
                <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '4px', gap: '10px' }}>
                    {/* Left: FIBA logo placeholder */}
                    <div style={{ width: '48px', height: '48px', border: '1px solid #999', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '7px', fontWeight: 'bold', flexShrink: 0, textAlign: 'center' }}>
                        FIBA
                    </div>

                    {/* Center: Title and match info */}
                    <div style={{ flex: 1, textAlign: 'center' }}>
                        <div style={{ fontSize: '12px', fontWeight: 'bold' }}>
                            {partido.competicion || 'Competición'}; {eqLocal.nombre} Vs. {eqVisit.nombre}
                        </div>
                        <div style={{ fontSize: '8px', marginTop: '1px' }}>
                            {partido.cancha || ''}, {fechaStr} Horario de inicio: {horaStr}
                        </div>
                        <div style={{ fontSize: '11px', fontWeight: 'bold', marginTop: '3px' }}>
                            ✓ {eqLocal.nombre?.toUpperCase()} {partido.pts_local} – {partido.pts_visitante} {eqVisit.nombre?.toUpperCase()}
                        </div>
                        <div style={{ fontSize: '8px' }}>
                            ({quarterScores.local.join(', ')})
                        </div>
                    </div>

                    {/* Right: Planilla info box */}
                    <div style={{ border: '1px solid #000', padding: '3px 6px', fontSize: '8px', textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontWeight: 'bold', fontSize: '10px' }}>Planilla estadística</div>
                        <div style={{ fontWeight: 'bold', fontSize: '12px' }}>FIBA</div>
                        <div style={{ marginTop: '2px' }}>Juego No.: {partido.id}</div>
                        <div>Reporte generado: {new Date().toLocaleDateString('es-DO')}</div>
                    </div>
                </div>

                {/* Referees */}
                <div style={{ fontSize: '8px', textAlign: 'center', marginBottom: '3px', fontWeight: 'bold' }}>
                    Árbitro: {partido.arbitro_principal || 'N/A'} &nbsp; Árbitro(s): {partido.arbitro_asistente1 || ''}{partido.arbitro_asistente2 ? `, ${partido.arbitro_asistente2}` : ''}
                </div>

                {/* ═══════ RESULTADO POR 5 INTERVALOS (cuartos) ═══════ */}
                <div style={{ display: 'flex', alignItems: 'center', fontSize: '8px', marginBottom: '6px', gap: '6px' }}>
                    <span style={{ fontWeight: 'bold', fontSize: '8px' }}>Resultado por 5 intervalo de minutos</span>
                    <table style={{ borderCollapse: 'collapse' }}>
                        <thead>
                            <tr>
                                <th style={{ ...headerCellStyle, width: '32px' }}></th>
                                <th style={headerCellStyle} colSpan={2}>C1</th>
                                <th style={headerCellStyle} colSpan={2}>C2</th>
                                <th style={headerCellStyle} colSpan={2}>C3</th>
                                <th style={headerCellStyle} colSpan={2}>C4</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td style={{ ...cellStyle, fontWeight: 'bold' }}>{abrevL}</td>
                                <td style={cellStyle}>{quarterScores.local[0]}</td>
                                <td style={{ ...cellStyle, fontWeight: 'bold' }}>{accumulatedL[0]}</td>
                                <td style={cellStyle}>{quarterScores.local[1]}</td>
                                <td style={{ ...cellStyle, fontWeight: 'bold' }}>{accumulatedL[1]}</td>
                                <td style={cellStyle}>{quarterScores.local[2]}</td>
                                <td style={{ ...cellStyle, fontWeight: 'bold' }}>{accumulatedL[2]}</td>
                                <td style={cellStyle}>{quarterScores.local[3]}</td>
                                <td style={{ ...cellStyle, fontWeight: 'bold' }}>{accumulatedL[3]}</td>
                            </tr>
                            <tr>
                                <td style={{ ...cellStyle, fontWeight: 'bold' }}>{abrevV}</td>
                                <td style={cellStyle}>{quarterScores.visitante[0]}</td>
                                <td style={{ ...cellStyle, fontWeight: 'bold' }}>{accumulatedV[0]}</td>
                                <td style={cellStyle}>{quarterScores.visitante[1]}</td>
                                <td style={{ ...cellStyle, fontWeight: 'bold' }}>{accumulatedV[1]}</td>
                                <td style={cellStyle}>{quarterScores.visitante[2]}</td>
                                <td style={{ ...cellStyle, fontWeight: 'bold' }}>{accumulatedV[2]}</td>
                                <td style={cellStyle}>{quarterScores.visitante[3]}</td>
                                <td style={{ ...cellStyle, fontWeight: 'bold' }}>{accumulatedV[3]}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* ═══════ TEAM A TABLE ═══════ */}
                {renderTeamTable(
                    eqLocal.nombre,
                    abrevL,
                    evL,
                    eqLocal.entrenador,
                    [eqLocal.asistente1, eqLocal.asistente2].filter(Boolean).join(', '),
                    true
                )}

                {/* ═══════ TEAM B TABLE ═══════ */}
                {renderTeamTable(
                    eqVisit.nombre,
                    abrevV,
                    evV,
                    eqVisit.entrenador,
                    [eqVisit.asistente1, eqVisit.asistente2].filter(Boolean).join(', '),
                    false
                )}

                {/* ═══════ BOTTOM SUMMARY TABLES ═══════ */}
                <div style={{ display: 'flex', gap: '8px', marginTop: '6px', fontSize: '8px' }}>

                    {/* Left summary table */}
                    <table style={{ borderCollapse: 'collapse', flex: '1' }}>
                        <thead>
                            <tr>
                                <th style={headerCellStyle}></th>
                                <th style={headerCellStyle}>{abrevL}</th>
                                <th style={headerCellStyle}>{abrevV}</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td style={{ ...cellStyle, textAlign: 'left', fontWeight: 'bold', paddingLeft: '3px' }}>Puntos de pérdidas</td>
                                <td style={cellStyle}>{cd.pts_tras_perdida?.local || 0}</td>
                                <td style={cellStyle}>{cd.pts_tras_perdida?.visitante || 0}</td>
                            </tr>
                            <tr>
                                <td style={{ ...cellStyle, textAlign: 'left', fontWeight: 'bold', paddingLeft: '3px' }}>Puntos en la pintura</td>
                                <td style={cellStyle}>{cd.pts_pintura?.local || 0}</td>
                                <td style={cellStyle}>{cd.pts_pintura?.visitante || 0}</td>
                            </tr>
                            <tr>
                                <td style={{ ...cellStyle, textAlign: 'left', fontWeight: 'bold', paddingLeft: '3px' }}>Puntos de segunda oportunidad</td>
                                <td style={cellStyle}>{cd.pts_segunda_oportunidad?.local || 0}</td>
                                <td style={cellStyle}>{cd.pts_segunda_oportunidad?.visitante || 0}</td>
                            </tr>
                            <tr>
                                <td style={{ ...cellStyle, textAlign: 'left', fontWeight: 'bold', paddingLeft: '3px' }}>Puntos de contra ataque</td>
                                <td style={cellStyle}>{cd.pts_contraataque?.local || 0}</td>
                                <td style={cellStyle}>{cd.pts_contraataque?.visitante || 0}</td>
                            </tr>
                            <tr>
                                <td style={{ ...cellStyle, textAlign: 'left', fontWeight: 'bold', paddingLeft: '3px' }}>Puntos de la banca</td>
                                <td style={cellStyle}>{cd.pts_banquillo?.local || 0}</td>
                                <td style={cellStyle}>{cd.pts_banquillo?.visitante || 0}</td>
                            </tr>
                        </tbody>
                    </table>

                    {/* Right summary table */}
                    <table style={{ borderCollapse: 'collapse', flex: '1' }}>
                        <thead>
                            <tr>
                                <th style={headerCellStyle}></th>
                                <th style={headerCellStyle}>{abrevL}</th>
                                <th style={headerCellStyle}>{abrevV}</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td style={{ ...cellStyle, textAlign: 'left', fontWeight: 'bold', paddingLeft: '3px' }}>Mayor ventaja</td>
                                <td style={cellStyle}>{ci.mayor_ventaja?.local || 0}</td>
                                <td style={cellStyle}>{ci.mayor_ventaja?.visitante || 0}</td>
                            </tr>
                            <tr>
                                <td style={{ ...cellStyle, textAlign: 'left', fontWeight: 'bold', paddingLeft: '3px' }}>Mayor racha de anotación consecutiva</td>
                                <td style={cellStyle}>{ci.mayor_racha?.local || 0}</td>
                                <td style={cellStyle}>{ci.mayor_racha?.visitante || 0}</td>
                            </tr>
                            <tr>
                                <td style={{ ...cellStyle, textAlign: 'left', fontWeight: 'bold', paddingLeft: '3px' }}>Cambios de liderazgo</td>
                                <td style={cellStyle} colSpan={2}>{ci.cambios_liderazgo || 0}</td>
                            </tr>
                            <tr>
                                <td style={{ ...cellStyle, textAlign: 'left', fontWeight: 'bold', paddingLeft: '3px' }}>Empates</td>
                                <td style={cellStyle} colSpan={2}>{ci.empates || 0}</td>
                            </tr>
                            <tr>
                                <td style={{ ...cellStyle, textAlign: 'left', fontWeight: 'bold', paddingLeft: '3px' }}>Tiempo liderando</td>
                                <td style={cellStyle}>{ci.tiempo_con_ventaja?.local || '00:00'}</td>
                                <td style={cellStyle}>{ci.tiempo_con_ventaja?.visitante || '00:00'}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* ═══════ LEGEND ═══════ */}
                <div style={{ marginTop: '8px', borderTop: '1px solid #000', paddingTop: '4px' }}>
                    <div style={{ fontWeight: 'bold', fontSize: '8px', marginBottom: '2px' }}>Leyenda</div>
                    <div style={{ display: 'flex', gap: '20px', fontSize: '7px', lineHeight: '1.4' }}>
                        <div>
                            <div><b>No</b> &nbsp; Número jugador</div>
                            <div><b>RD</b> &nbsp; Rebotes Defensivos</div>
                            <div><b>TF</b> &nbsp; Bloqueos</div>
                            <div><b>Ef</b> &nbsp; Eficiencia</div>
                        </div>
                        <div>
                            <div><b>Min</b> &nbsp; Minutos jugados</div>
                            <div><b>RT</b> &nbsp; Rebotes totales</div>
                            <div><b>TR</b> &nbsp; Bloqueos recibidos</div>
                            <div><b>Pts</b> &nbsp; Puntos</div>
                        </div>
                        <div>
                            <div><b>CA</b> &nbsp; Lanzamientos convertidos</div>
                            <div><b>AS</b> &nbsp; Asistencias</div>
                            <div><b>FC</b> &nbsp; Faltas personales</div>
                            <div><b>*</b> &nbsp; Titulares</div>
                        </div>
                        <div>
                            <div><b>%</b> &nbsp; Porcentaje de tiro</div>
                            <div><b>Per</b> &nbsp; Pérdidas</div>
                            <div><b>FR</b> &nbsp; Faltas recibidas</div>
                            <div><b>NJ</b> &nbsp; No Jugó</div>
                        </div>
                        <div>
                            <div><b>RO</b> &nbsp; Rebotes ofensivos</div>
                            <div><b>Rec</b> &nbsp; Recuperos → Robos</div>
                            <div><b>+/-</b> &nbsp; Más/Menos</div>
                        </div>
                    </div>
                </div>

            </div>
        </>
    )
}
