'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export default function GolfMetronome() {
	const audioContextRef = useRef(null);
	const nextNoteTimeRef = useRef(0);
	const currentBeatRef = useRef(0);
	// Cycle state
	const phaseRef = useRef('pre'); // 'pre' | 'beeps' | 'post'
	const preCountRef = useRef(0);
	const beepIndexRef = useRef(0);
	const postCountRef = useRef(0);
	const schedulerIdRef = useRef(null);
	const lookaheadMs = 25;
	const scheduleAheadTime = 0.1;

	const [bpm, setBpm] = useState(72);
	const [isRunning, setIsRunning] = useState(false);
	const [preSilenceBeats, setPreSilenceBeats] = useState(2); // silent beats before beeps
	const [postSilenceBeats, setPostSilenceBeats] = useState(1); // silent beats after beeps
	const [beepsPerCycle, setBeepsPerCycle] = useState(3); // number of beeps in the sequence
	const [subdivision, setSubdivision] = useState(3); // simple visualization base, not used for logic

	const secondsPerBeat = useMemo(() => 60 / bpm, [bpm]);

// Persist BPM
useEffect(() => {
	try {
		localStorage.setItem('metro-golf-bpm', String(bpm));
	} catch {}
}, [bpm]);

useEffect(() => {
	try {
		const stored = localStorage.getItem('metro-golf-bpm');
		if (stored) setBpm(Number(stored));
	} catch {}
}, []);

const clickFreqForBeat = useCallback((beatIndex, isAccent) => {
	// Consistent tones: accent = 1000 Hz, normal = 800 Hz
	return isAccent ? 1000 : 800;
}, []);

const scheduleClick = useCallback((time, beatIndex, isAccent) => {
	const ctx = audioContextRef.current;
	if (!ctx) return;
	const osc = ctx.createOscillator();
	const env = ctx.createGain();
	osc.type = 'sine';
	osc.frequency.setValueAtTime(clickFreqForBeat(beatIndex, isAccent), time);
	const peak = isAccent ? 0.28 : 0.2; // stable volume
	env.gain.setValueAtTime(0.0001, time);
	env.gain.linearRampToValueAtTime(peak, time + 0.002);
	env.gain.linearRampToValueAtTime(0.0001, time + 0.032);
	osc.connect(env).connect(ctx.destination);
	osc.start(time);
	osc.stop(time + 0.04);
}, [clickFreqForBeat]);

// Accent on first beep of the sequence
const pattern = useMemo(() => ({ accentIndex: 0 }), []);

	const scheduler = useCallback(() => {
		const ctx = audioContextRef.current;
		if (!ctx) return;
		while (nextNoteTimeRef.current < ctx.currentTime + scheduleAheadTime) {
			if (phaseRef.current === 'pre') {
				// Silent beats before beeps
				if (preCountRef.current < preSilenceBeats) {
					nextNoteTimeRef.current += secondsPerBeat;
					preCountRef.current += 1;
					continue;
				}
				// Move to beep phase
				phaseRef.current = 'beeps';
				beepIndexRef.current = 0;
				continue;
			}

			if (phaseRef.current === 'beeps') {
				if (beepIndexRef.current < beepsPerCycle) {
					const isAccent = beepIndexRef.current === pattern.accentIndex;
					scheduleClick(nextNoteTimeRef.current, currentBeatRef.current, isAccent);
					nextNoteTimeRef.current += secondsPerBeat;
					currentBeatRef.current = (currentBeatRef.current + 1) % subdivision;
					beepIndexRef.current += 1;
					continue;
				}
				// Move to post-silence
				phaseRef.current = 'post';
				postCountRef.current = 0;
				continue;
			}

			// post
			if (postCountRef.current < postSilenceBeats) {
				nextNoteTimeRef.current += secondsPerBeat;
				postCountRef.current += 1;
				continue;
			}
			// Loop back
			phaseRef.current = 'pre';
			preCountRef.current = 0;
		}
	}, [scheduleAheadTime, secondsPerBeat, subdivision, scheduleClick, preSilenceBeats, beepsPerCycle, postSilenceBeats, pattern]);

	const start = useCallback(async () => {
		if (isRunning) return;
		if (!audioContextRef.current) {
			audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
		}
		const ctx = audioContextRef.current;
		await ctx.resume();
		nextNoteTimeRef.current = ctx.currentTime + 0.2;
		currentBeatRef.current = 0;
		phaseRef.current = 'pre';
		preCountRef.current = 0;
		beepIndexRef.current = 0;
		postCountRef.current = 0;
		schedulerIdRef.current = setInterval(scheduler, lookaheadMs);
		setIsRunning(true);
	}, [isRunning, scheduler]);

	const stop = useCallback(() => {
		if (!isRunning) return;
		if (schedulerIdRef.current) {
			clearInterval(schedulerIdRef.current);
			schedulerIdRef.current = null;
		}
		setIsRunning(false);
	}, [isRunning]);

	useEffect(() => () => {
		if (schedulerIdRef.current) clearInterval(schedulerIdRef.current);
		if (audioContextRef.current) audioContextRef.current.close();
	}, []);

	const bpmHint = '60–90 suggested';
	const minBpm = 40;
	const maxBpm = 120;

	return (
		<div style={{ display: 'grid', gap: 16 }}>
			<label style={{ display: 'grid', gap: 8 }}>
				<span>BPM: {bpm} <span style={{ opacity: 0.7 }}>({bpmHint})</span></span>
				<input type="range" min={minBpm} max={maxBpm} step="1" value={bpm} onChange={(e) => setBpm(Number(e.target.value))} style={{ width: '100%' }} />
			</label>

			<div style={{ display: 'grid', gap: 12 }}>
				<label style={{ display: 'grid', gap: 6 }}>
					<span>Beeps per cycle: {beepsPerCycle}</span>
					<input type="range" min="1" max="8" step="1" value={beepsPerCycle} onChange={(e) => setBeepsPerCycle(Number(e.target.value))} />
				</label>
				<div style={{ display: 'flex', gap: 12 }}>
					<label style={{ display: 'grid', gap: 6, flex: 1 }}>
						<span>Pre-silence (beats): {preSilenceBeats}</span>
						<input type="range" min="0" max="8" step="1" value={preSilenceBeats} onChange={(e) => setPreSilenceBeats(Number(e.target.value))} />
					</label>
					<label style={{ display: 'grid', gap: 6, flex: 1 }}>
						<span>Post-silence (beats): {postSilenceBeats}</span>
						<input type="range" min="0" max="8" step="1" value={postSilenceBeats} onChange={(e) => setPostSilenceBeats(Number(e.target.value))} />
					</label>
				</div>
				<label style={{ display: 'grid', gap: 6, flex: 1 }}>
					<span>Visualization beats per bar: {subdivision}</span>
					<input type="range" min="1" max="12" step="1" value={subdivision} onChange={(e) => setSubdivision(Number(e.target.value))} />
				</label>
			</div>

			<div style={{ opacity: 0.8 }}>Cycle: pre-silence → beeps (accent on first) → post-silence → repeat</div>

			<div style={{ display: 'flex', gap: 12 }}>
				<button onClick={isRunning ? stop : start} style={{ flex: 1, padding: '12px 16px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.12)', background: isRunning ? '#c62828' : '#1b5e20', color: 'white', cursor: 'pointer' }}>
					{isRunning ? 'Stop' : 'Start'}
				</button>
			</div>
		</div>
	);
}


