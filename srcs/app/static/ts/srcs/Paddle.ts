export class Paddle {
    x: number;
    y: number;
    width: number;
    height: number;

    constructor(data: { player: { x: number; y: number; width: number; height: number }; player2: { x: number; y: number; width: number; height: number } }, isAI: boolean = false) {
        const source = isAI ? data.player2 : data.player;
        this.x = source.x;
        this.y = source.y;
        this.width = source.width;
        this.height = source.height;
    }

    draw(ctx: CanvasRenderingContext2D | null) {
        if (!ctx) return;
        ctx.fillStyle = "white";
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
}
