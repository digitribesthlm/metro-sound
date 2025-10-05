'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import GolfMetronome from './components/GolfMetronome';
import './globals.css';

function useMetronome() {
	const audioContextRef = useRef(null);
	const nextNoteTimeRef = useRef(0);
	const currentBeatRef = useRef(0);
	const schedulerIdRef = useRef(null);
	const lookaheadMs = 25; // scheduler interval
	const scheduleAheadTime = 0.1; // seconds to schedule ahead

	const [bpm, setBpm] = useState(100);
	const [isRunning, setIsRunning] = useState(false);
	const [subdivision, setSubdivision] = useState(4); // beats per bar visualization

	const secondsPerBeat = useMemo(() => 60.0 / bpm, [bpm]);

	const clickFreqForBeat = useCallback((beatIndex) => {
		// Accented click for downbeat
		return beatIndex % subdivision === 0 ? 1500 : 1000;
	}, [subdivision]);

	const scheduleClick = useCallback((time, beatIndex) => {
		const ctx = audioContextRef.current;
		if (!ctx) return;
		const osc = ctx.createOscillator();
		const env = ctx.createGain();
		osc.type = 'square';
		osc.frequency.setValueAtTime(clickFreqForBeat(beatIndex), time);
		env.gain.setValueAtTime(0.0001, time);
		env.gain.exponentialRampToValueAtTime(1.0, time + 0.001);
		env.gain.exponentialRampToValueAtTime(0.0001, time + 0.05);
		osc.connect(env).connect(ctx.destination);
		osc.start(time);
		osc.stop(time + 0.06);
	}, [clickFreqForBeat]);

	const scheduler = useCallback(() => {
		const ctx = audioContextRef.current;
		if (!ctx) return;
		while (nextNoteTimeRef.current < ctx.currentTime + scheduleAheadTime) {
			scheduleClick(nextNoteTimeRef.current, currentBeatRef.current);
			nextNoteTimeRef.current += secondsPerBeat;
			currentBeatRef.current = (currentBeatRef.current + 1) % subdivision;
		}
	}, [scheduleAheadTime, secondsPerBeat, subdivision, scheduleClick]);

	const start = useCallback(async () => {
		if (isRunning) return;
		if (!audioContextRef.current) {
			audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
		}
		const ctx = audioContextRef.current;
		await ctx.resume();
		nextNoteTimeRef.current = ctx.currentTime + 0.05;
		currentBeatRef.current = 0;
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

	useEffect(() => {
		return () => {
			if (schedulerIdRef.current) clearInterval(schedulerIdRef.current);
			if (audioContextRef.current) audioContextRef.current.close();
		};
	}, []);

	return {
		bpm,
		setBpm,
		isRunning,
		start,
		stop,
		subdivision,
		setSubdivision,
	};
}

export default function Page() {
	const { bpm, setBpm, isRunning, start, stop, subdivision, setSubdivision } = useMetronome();

	return (
		<div className="min-h-dvh grid place-items-center p-4 bg-gradient-to-b from-base-200 to-base-300">
			<div className="w-full max-w-md card bg-base-100 shadow-2xl">
				<div className="card-body">
					<h1 className="card-title text-3xl">Metro Sound • Golf</h1>
					<p className="opacity-70 text-sm">1–2–3 beeps with pre/post silence for putting flow</p>
					<div className="mt-2">
						<GolfMetronome />
					</div>
				</div>
			</div>
		</div>
	);
}


