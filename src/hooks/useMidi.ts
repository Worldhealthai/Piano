import { useCallback, useEffect, useRef } from 'react';
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
  const midiAccess = useRef<MIDIAccess | null>(null);
  const activeInputs = useRef<Map<string, MIDIInput>>(new Map());

  const handleMidiMessage = useCallback(
    (event: MIDIMessageEvent) => {
      const data = event.data;
      if (!data || data.length < 2) return;

      const status = data[0];
      const note = data[1];
      const velocity = data[2] ?? 0;

      const channel = status & 0x0f;
      const msgType = status & 0xf0;

      // Note On
      if (msgType === 0x90 && velocity > 0) {
        const noteName = midiToNote(note);
        onNoteOn(noteName, velocity / 127);
      }
      // Note Off or Note On with velocity 0
      else if (msgType === 0x80 || (msgType === 0x90 && velocity === 0)) {
        const noteName = midiToNote(note);
        onNoteOff(noteName);
      }

      void channel; // suppress unused warning
    },
    [onNoteOn, onNoteOff]
  );

  const connectDevices = useCallback(
    (access: MIDIAccess) => {
      // Disconnect all existing
      activeInputs.current.forEach((input) => {
        input.onmidimessage = null;
      });
      activeInputs.current.clear();

      const devices: MidiDevice[] = [];
      let connected = false;

      access.inputs.forEach((input) => {
        devices.push({
          id: input.id,
          name: input.name ?? `MIDI Device ${input.id}`,
          manufacturer: input.manufacturer ?? undefined,
        });

        // Connect if it's the selected device, or if no device selected, connect all
        if (!selectedDeviceId || input.id === selectedDeviceId) {
          input.onmidimessage = handleMidiMessage;
          activeInputs.current.set(input.id, input);
          connected = true;
        }
      });

      setMidiDevices(devices);
      setMidiConnected(connected && devices.length > 0);
    },
    [selectedDeviceId, handleMidiMessage, setMidiDevices, setMidiConnected]
  );

  useEffect(() => {
    if (!navigator.requestMIDIAccess) {
      // MIDI not supported
      return;
    }

    navigator
      .requestMIDIAccess({ sysex: false })
      .then((access) => {
        midiAccess.current = access;
        connectDevices(access);

        access.onstatechange = () => {
          if (midiAccess.current) {
            connectDevices(midiAccess.current);
          }
        };
      })
      .catch(() => {
        // MIDI access denied or unavailable
        setMidiConnected(false);
      });

    return () => {
      activeInputs.current.forEach((input) => {
        input.onmidimessage = null;
      });
    };
  }, [connectDevices, setMidiConnected]);

  // Reconnect when selected device changes
  useEffect(() => {
    if (midiAccess.current) {
      connectDevices(midiAccess.current);
    }
  }, [selectedDeviceId, connectDevices]);
}
