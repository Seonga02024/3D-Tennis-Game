import { Application, Font, GameObject } from 'UnityEngine';
import { UnityEvent } from 'UnityEngine.Events';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'

export const enum Language {
    Korean = 0,
    English = 1,
    Japanese = 2,
    Chinese = 3,
    Indonesian = 4,
    Thai = 5,
    ChineseSimplified = 6,
    French = 7
}

export default class TS_Text extends ZepetoScriptBehaviour {

    /* Value */
    public tiTont : Font;
    public defaultFont : Font;

    /* Event */
    public OnLanguageChanged : UnityEvent = new UnityEvent();
    
    /* Singleton */
    private static Instance: TS_Text;
    public static GetInstance(): TS_Text {
        if (!TS_Text.Instance) {
            const targetObj = GameObject.Find("TextController");
            if (targetObj)
            TS_Text.Instance = targetObj.GetComponent<TS_Text>();
        }
        return TS_Text.Instance;
    }

    // Language
    private mCurLanguage : Language = Language.English;
    public get CurLanguage() { return this.mCurLanguage; }
    public setLanguage(language : Language) { 
        this.mCurLanguage = language;
        this.OnLanguageChanged.Invoke();
    }

    public GetRightFont() : Font {
        if(this.mCurLanguage == Language.Thai){
            return this.tiTont;
        }
        else {
            return this.defaultFont;
        }
    }

    public SetLanguageToDeviceDefaultLanguage() {
        // 현재 장치 언어 불러오기
        switch (Application.systemLanguage) {
            // 한국어
            case 23:
                this.setLanguage(Language.Korean);
                break;
            // 영어
            case 10:
                this.setLanguage(Language.English);
                break;
            // 프랑스
            case 14:
                this.setLanguage(Language.French);
                break;
            // 일본어
            case 22:
                this.setLanguage(Language.Japanese);
                break;
            // 중국어
            case 6:
                this.setLanguage(Language.Chinese);
                break;
            // 중국어 간체
            case 40:
            case 41:
                this.setLanguage(Language.ChineseSimplified);
                break;
            // 인도네시아어
            case 20:
                this.setLanguage(Language.Indonesian);
                break;
            // 태국어
            case 36:
                this.setLanguage(Language.Thai);
                break;
            // 기본 : 영어
            default:
                this.setLanguage(Language.English);
                break;
        }
    }

}