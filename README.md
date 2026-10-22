# Atlas Ósseo — versão Master

Projeto educacional independente em HTML, CSS e JavaScript, com visualizador 3D procedural via Three.js.

## Estrutura

- `index.html` — conteúdo e estrutura semântica da página.
- `css/style.css` — identidade visual, layout responsivo, acessibilidade e animações.
- `js/main.js` — navegação, visualizador 3D, estações de estudo, controles, quiz e glossário.

## Como executar

1. Extraia a pasta `atlas-osseo-master`.
2. Abra a pasta no Visual Studio Code.
3. Para melhor compatibilidade, instale a extensão **Live Server**.
4. Clique com o botão direito em `index.html` e selecione **Open with Live Server**.
5. O navegador precisa de internet para carregar Three.js e as fontes externas.

Também é possível abrir `index.html` diretamente em navegadores modernos, mas um servidor local costuma ser mais confiável para projetos com módulos e recursos externos.

## Controles 3D

- Arraste o modelo para girá-lo.
- Use a roda do mouse ou gesto equivalente para aproximar/afastar.
- Selecione as estações no painel esquerdo para alternar a representação.
- Pause a rotação automática ou reinicie a vista.

## Limites científicos e técnicos

O modelo 3D é gerado por geometria procedural e serve como ilustração educativa. Não é uma reconstrução anatômica clínica nem um modelo de elementos finitos. As visualizações de forças são conceituais e não calculam tensões reais. Os tempos de consolidação variam; não há prazo universal para todas as fraturas. O site não substitui diagnóstico, avaliação médica ou diretrizes clínicas.

As fontes externas são pontos de partida para pesquisa. Para trabalhos formais, consulte e cite a publicação específica que sustenta cada afirmação.

## Próximas melhorias possíveis

- Substituir ou complementar o modelo procedural por modelos anatômicos GLB/GLTF com licença adequada e proveniência documentada.
- Criar páginas dedicadas para cada módulo.
- Acrescentar microfotografias histológicas com escala, técnica de coloração, tecido e fonte documentados.
- Adicionar bibliografia por tópico e citações inline.
- Implementar testes automatizados e otimização adicional de acessibilidade.
