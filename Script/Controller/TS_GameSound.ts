import { WaitForSeconds } from 'UnityEngine';
import { GameObject } from 'UnityEngine';
import { AudioClip, AudioSource, Coroutine, Mathf, Time } from 'UnityEngine';
import { AudioMixer } from 'UnityEngine.Audio';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'

export enum BGM {
    Main = 0,
    InDoor = 1
}

export enum SFX {
    TennisBallHitMe = 0,
    TennisBallHitNotMe = 1
    // UITouch = 0,
    // UIClose = 1,
}


export default class TS_GameSound extends ZepetoScriptBehaviour {

    @Header("[Object Setting]")
    @SerializeField()
    private audioMixer : AudioMixer;
    private audioSource : AudioSource;

    @Header("[BGM]")
    @SerializeField()
    private bgmSources : AudioClip[];

    @Header("[SFX]")
    @SerializeField()
    private sfxSource : AudioSource[];

    private fadeOutCoroutine : Coroutine;

    private isPause : boolean = false;
    public get IsPause() { return this.isPause; }
    private bgmCur : BGM = BGM.Main;
    private audioVolume : number;
    private audioVolumeCur : number = 0;

    private checkMax : number = 0.2;
    private checkMin : number = 1;

    /* Singleton */
    private static Instance: TS_GameSound;
    public static GetInstance(): TS_GameSound {
        if (!TS_GameSound.Instance) {
            const targetObj = GameObject.Find("GameSound");
            if (targetObj)
            TS_GameSound.Instance = targetObj.GetComponentInChildren<TS_GameSound>();
        }
        return TS_GameSound.Instance;
    }

    ////////////////////////////////////////////////////////////////////////////////

    public sfxPlay(sfx : SFX) : void {
        this.sfxSource[sfx].Play();
    }

    public bgmPlay() : void {
        if(!this.audioSource.isPlaying) {
            if(this.isPause) {
                this.isPause = false;
                this.audioSource.UnPause();
            }
            else {
                this.audioSource.clip = this.bgmSources[this.bgmCur];
                this.audioSource.Play();
                this.StartCoroutine(this.fadeIn());
            }
        }
        else{
            if(this.fadeOutCoroutine != null) {
                this.StopCoroutine(this.fadeOutCoroutine);
            }
            this.fadeOutCoroutine = this.StartCoroutine(this.fadeOut());
        }
    }

    public bgmPause() : void {
        if(this.audioSource.isPlaying) {
            this.audioSource.Pause();
            this.isPause = true;
        }
    }

    public bgmSet(index : BGM, maxSound : number) : void {
        this.bgmCur = index;
        this.checkMax = maxSound;
    }

    ////////////////////////////////////////////////////////////////////////////////

    // 1sec
    private * fadeOut() {
        this.audioVolumeCur = this.checkMin;
        let minIntervalTime : number = Time.deltaTime;
        while (true) {
            if(this.audioVolumeCur > 0) {
                this.audioVolumeCur -= (this.checkMin * minIntervalTime);
                this.audioSource.volume = this.audioVolumeCur;
                yield new WaitForSeconds(minIntervalTime);
            }
            else {
                break;
            }
        }
        this.audioSource.clip = this.bgmSources[this.bgmCur];
        this.audioSource.Play();
        this.StartCoroutine(this.fadeIn());
        this.audioSource.volume = this.audioVolume;
        this.checkMin = this.checkMax;
    }

    // 1sec
    private * fadeIn() {
        this.audioSource.volume = 0;
        this.audioVolumeCur = 0;
        let minIntervalTime : number = Time.deltaTime;
        while (true) {
            if(this.audioVolumeCur < this.checkMax) {
                this.audioVolumeCur += (this.audioVolume * minIntervalTime);
                this.audioSource.volume = this.audioVolumeCur;
                yield new WaitForSeconds(minIntervalTime);
            }
            else {
                break;
            }
        }
    }

    // 0 ~ 1
    private setAudioMixer(value : number) {
        if(value < 0.0001) {
            this.audioMixer.SetFloat('Master', -80);
        }
        else {
            this.audioMixer.SetFloat('Master', Mathf.Log10(value) * 20);
        }
    }

    private Awake() {
        this.audioSource = this.GetComponent<AudioSource>();
        this.audioVolume = this.audioSource.volume;
    }

    private Start() {
        //this.bgmSet(BGM.InDoor, 1);
        //this.bgmPlay();
        //this.audioSource.clip = this.bgmSources[this.bgmCur];
        //this.audioSource.Play();
    }

}