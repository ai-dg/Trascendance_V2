import { Scene, game_scene } from "./Scene";
import { Ball } from "./Ball";
import { Paddle } from "./Paddle";
import { Score } from "./Score";
import { Numbers } from "./Numbers";




export interface GameParams {
    opponent: string,
    player: number,
    max_pts:number, 
    win_condition: number,
    level:string
}

export const DEFAULT_GAME_PARAMS: GameParams = { opponent: "remote", player: 2, max_pts:10, win_condition: 5, level:"none"};
export let CUSTOM_GAME_PARAMS: GameParams = { opponent: "remote", player: 2, max_pts:10, win_condition: 5, level:"none"};

interface GameData {
    scene: { canvas_id: string; width?: number; height?: number };
    player: { x: number; y: number; width: number; height: number };
    player2: { x: number; y: number; width: number; height: number };
    ball: { x: number; y: number; size: number };
    score: any;
}

export class Game {
    private data: GameData;
    private scene: Scene;
    private player: Paddle;
    private player2: Paddle;
    private ball: Ball;
    private score: Score;
    private numbers: Numbers;
    private running : Boolean
    private animationFrameId: number | null = null;

    constructor(data: GameData) {
        console.log("🟢 Game class created");

        this.data = data;
        this.scene = game_scene;
        this.player = new Paddle(this.data, false);
        this.player2 = new Paddle(this.data, true);
        this.ball = new Ball(this.data);
        this.score = new Score(this.data.score);
        this.numbers = new Numbers(this.data.score);
        this.running = true;
        
        this.loop();
    }

    private loop(): void {
        if (this.running)
        {
            this.render();
        }
        this.animationFrameId = requestAnimationFrame(() => this.loop());
    }

    start(): void{
        this.running = true
    }

    stop(): void{
        this.running = false;
        this.scene.clear();
        this.numbers.clear(); 
    }


    private render(): void {
        this.scene.clear();
        this.score.clear(); 
        this.numbers.clear(); 
        this.scene.draw([this.player, this.player2, this.ball]);
        this.score.draw([this.numbers]);
    }

    updateGame(newData: GameData): void {
        this.data = newData;
        this.player.x = newData.player.x;
        this.player.y = newData.player.y;
        this.player2.x = newData.player2.x;
        this.player2.y = newData.player2.y;

        this.ball.update(newData);
        this.numbers.update(newData.score);
    }
}