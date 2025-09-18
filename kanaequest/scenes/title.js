// kanaequest/scenes/title.js

import { loadGame } from "../utils/stateManager.js";

export default function createTitleScene(k) {
    // A cena é definida dentro desta função
    return () => {
        // Adiciona um fundo (você pode criar um 'title_screen.png')
        k.add([
            k.rect(k.width(), k.height()),
            k.color(10, 10, 30),
            k.z("bg"),
        ]);

        // Título do Jogo
        k.add([
            k.text("Kanae Quest", { size: 50, font: "sans-serif" }),
            k.pos(k.center().x, k.height() * 0.3),
            k.anchor("center"),
            k.z("ui"),
        ]);

        // Botão "Novo Jogo"
        const newGameBtn = k.add([
            k.rect(200, 50, { radius: 8 }),
            k.pos(k.center().x, k.height() * 0.6),
            k.anchor("center"),
            k.area(), // Permite que o objeto seja clicável
            k.z("ui"),
            "newGameBtn",
        ]);
        newGameBtn.add([
            k.text("Novo Jogo", { size: 24 }),
            k.anchor("center"),
            k.color(0, 0, 0),
        ]);
        k.onClick("newGameBtn", () => {
            k.go("characterSelect");
        });

        // Botão "Continuar" - só aparece se houver um save
        if (localStorage.getItem("kanaeQuestSave")) {
            const continueBtn = k.add([
                k.rect(200, 50, { radius: 8 }),
                k.pos(k.center().x, k.height() * 0.75),
                k.anchor("center"),
                k.area(),
                k.z("ui"),
                "continueBtn",
            ]);
            continueBtn.add([
                k.text("Continuar", { size: 24 }),
                k.anchor("center"),
                k.color(0, 0, 0),
            ]);
            k.onClick("continueBtn", () => {
                if (loadGame()) {
                    k.go("battle");
                }
            });
        }
    };
}