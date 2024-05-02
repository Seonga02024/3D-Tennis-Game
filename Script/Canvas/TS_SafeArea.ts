import { GameObject, Rect, RectTransform, Screen, Vector2 } from 'UnityEngine';
import { ZepetoScriptBehaviour } from 'ZEPETO.Script'

export default class TS_SafeArea extends ZepetoScriptBehaviour {

    public safeArea : GameObject; // safe area panel

    Start() {    
        // SafeArea Settings
        let safeArea: Rect = Screen.safeArea;
        let newAnchorMin = safeArea.position;
        let newAnchorMax = Vector2.op_Addition(safeArea.position, safeArea.size); 
        newAnchorMin.x /= Screen.width;
        newAnchorMax.x /= Screen.width;
        newAnchorMin.y /= Screen.height;
        newAnchorMax.y /= Screen.height;
        let rect = this.safeArea.GetComponent<RectTransform>();
        rect.anchorMin = newAnchorMin;
        rect.anchorMax = newAnchorMax;
    }

}