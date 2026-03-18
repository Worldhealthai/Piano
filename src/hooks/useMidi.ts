import { useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import { midiToNote } from '../utils/noteHelpers';
import type { MidiDevice } from '../types';

export function useMidi(
  onNoteOn: (note: string, velocity: number) => void,
  onNoteOff: (note: string) => void
) {
  const setMidiDevices = useStore((s) => s.setMidiDevices);
  const setMidiConnected = useStore((s) => s.setMidiConnected);
  const selectedDeviceId = useStore((s) => s.settings.selectedMidiDeviceId);

  // Keep callbacks in refs so the MIDI message handler never changes
  const onNoteOnRef = useRef(onNoteOn);
  const onNoteOffRef = useRef(onNoteOff);
  useEffect(() => { onNoteOnRef.current = onNoteOn; }, [onNoteOn]);
  useEffect(() => { onNoteOffRef.current = onNoteOff; }, [onNoteOff]);

  const midiAccess = useRef<MIDIAccess | null>(null);
  const activeInputs = useRef<Map<string, MIDIInput>>(new Map());
  const selectedDeviceIdRef = useRef(selectedDeviceId);
  useEffect(() => { selectedDeviceIdRef.current = selectedDeviceId; }, [selectedDeviceId]);

  // Single stable message handler — reads from refs
  const messageHandler = useRef((event: MIDIMessageEvent) => {
    const data = event.data;
    if (!data || data.length < 2) return;
    const status = data[0];
    const note = data[1];
    const velocity = data[2] ?? 0;
    const msgType = status & 0xf0;
    if (msgType === 0x90 && velocity > 0) {
      onNoteOnRef.current(midiToNote(note), velocity / 127);
    } else if (msgType === 0x80 || (msgType === 0x90 && velocity === 0)) {
      onNoteOffRef.current(midiToNote(note));
    }
  });

  const connectDevices = useRef((access: MIDIAccess) => {
    activeInputs.current.forEach((input) => { input.onmidimessage = null; });
    activeInputs.current.clear();

    const devices: MidiDevice[] = [];
    let connected = false;
    const sel = selectedDeviceIdRef.current;

    access.inputs.forEach((input) => {
      devices.push({
        id: input.id,
        name: input.name ?? `MIDI Device ${input.id}`,
        manufacturer: input.manufacturer ?? undefined,
      });
      if (!sel || input.id === sel) {
        input.onmidimessage = messageHandler.current;
        activeInputs.current.set(input.id, input);
        connected = true;
      }
    });

    // Batch both updates to avoid triggering two renders
    useStore.setState({ midiDevices: devices, midiConnected: connected && devices.length > 0 });
  });

  useEffect(() => {
    if (!navigator.requestMIDIAccess) return;

    navigator
      .requestMIDIAccess({ sysex: false })
      .then((access) => {
        midiAccess.current = access;
        connectDevices.current(access);
        access.onstatechange = () => {
          if (midiAccess.current) connectDevices.current(midiAccess.current);
        };
      })
      .catch(() => {
        setMidiConnected(false);
      });

    return () => {
      activeInputs.current.forEach((input) => { input.onmidimessage = null; });
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reconnect when selected device changes
  useEffect(() => {
    if (midiAccess.current) connectDevices.current(midiAccess.current);
  }, [selectedDeviceId]);

  void setMidiDevices; // consumed via useStore.setState directly
  void setMidiConnected;
}
