import { AUDIO_CONTEXT } from "$/Config"
import AudioRecorder from "$lib/AudioRecorder"


export class AudioProviderClass {
    audioContext: AudioContext
    reverbNode: ConvolverNode | null = null
    reverbVolumeNode: GainNode | null = null
    nodes: AudioNode[] = []
    hasReverb: boolean = false
    recorder: AudioRecorder | null
    isRecording: boolean = false
    reverbLoading: Promise<void> | null = null
    constructor(context: AudioContext) {
        this.audioContext = context
        this.recorder = new AudioRecorder()
    }

    private loadReverb = (): Promise<void> => {
        this.reverbLoading =  new Promise(resolve => {
            fetch("./assets/audio/reverb4.wav")
                .then(r => r.arrayBuffer())
                .then(b => {
                    if (this.audioContext) {
                        this.audioContext.decodeAudioData(b, (impulse_response) => {
                            const convolver = this.audioContext.createConvolver()
                            const gainNode = this.audioContext.createGain()
                            gainNode.gain.value = 2.5
                            convolver.buffer = impulse_response
                            convolver.connect(gainNode)
                            gainNode.connect(this.audioContext.destination)
                            this.reverbNode = convolver
                            this.reverbVolumeNode = gainNode
                            this.reverbLoading = null
                            resolve()
                        })
                    }
                }).catch((e) => {
                    console.error(e)
                    this.reverbLoading = null
                    resolve()
                })
        })
        return this.reverbLoading
    }

    waitReverb = async (): Promise<void> => {
        if (this.reverbLoading) {
            await this.reverbLoading
        }
    }
    init = async () => {
        await this.loadReverb()
        this.setAudioDestinations()
        return this
    }

    connect = (node: AudioNode | null) => {
        if (!node) return this
        this.nodes.push(node)
        this.setAudioDestinations()
        return this
    }

    destroy = () => {
        this.nodes.forEach(node => node.disconnect())
        this.nodes = []
        this.recorder = null
        this.reverbNode = null
        this.reverbVolumeNode = null
    }

    clear = () => {
        this.nodes.forEach(node => node.disconnect())
        this.nodes = []
        this.setReverb(false)
        return this
    }

    disconnect = (node: AudioNode | null) => {
        if (!node) return this
        this.nodes = this.nodes.filter(n => n !== node)
        node.disconnect()
        return this
    }

    setReverb = (reverb: boolean) => {
        this.hasReverb = reverb
        this.setAudioDestinations()
        return this
    }

    startRecording = () => {
        const { hasReverb, recorder, nodes, reverbVolumeNode } = this
        if (!recorder) return
        if (hasReverb) {
            if (reverbVolumeNode && recorder.node) reverbVolumeNode.connect(recorder.node)
        } else {
            nodes.forEach(node => {
                if (recorder.node) node.connect(recorder.node)
            })
        }
        this.isRecording = true
        recorder.start()
        return this
    }

    stopRecording = async () => {
        const { recorder, reverbVolumeNode, audioContext } = this
        if (!recorder) return
        const recording = await recorder.stop()
        if (reverbVolumeNode && audioContext) {
            reverbVolumeNode.disconnect()
            reverbVolumeNode.connect(this.audioContext.destination)
        }
        this.isRecording = false
        this.setAudioDestinations()
        return recording
    }

    setAudioDestinations = async () => {
        this.nodes.forEach(node => {
            if (this.hasReverb) {
                node.disconnect()
                if (!this.reverbNode) {
                    console.log("Couldn't connect to reverb")
                    if (this.audioContext) node.connect(this.audioContext.destination)
                } else {
                    node.connect(this.reverbNode)
                }
            } else {
                node.disconnect()
                if (this.audioContext) node.connect(this.audioContext.destination)
            }
        })
        return this
    }
}

export const AudioProvider = new AudioProviderClass(AUDIO_CONTEXT)
