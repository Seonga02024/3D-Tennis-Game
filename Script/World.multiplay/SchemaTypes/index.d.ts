declare module "ZEPETO.Multiplay.Schema" {

	import { Schema, MapSchema, ArraySchema } from "@colyseus/schema"; 


	interface State extends Schema {
		players: MapSchema<Player>;
		tennisBalls: MapSchema<TennisBall>;
	}
	class Vector3 extends Schema {
		x: number;
		y: number;
		z: number;
	}
	class Transform extends Schema {
		position: Vector3;
		rotation: Vector3;
	}
	class Player extends Schema {
		sessionId: string;
		zepetoUserId: string;
		transform: Transform;
		state: number;
		isHost: boolean;
		matchGameNum: number;
		currnetPlayerNum: number;
		pauseTime: number;
		isPause: boolean;
	}
	class TennisBall extends Schema {
		index: number;
		position: Vector3;
	}
}