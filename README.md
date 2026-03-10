# K8s Lecture Diagrams

Интерактивные диаграммы для лекции по Kubernetes — Сетевая подсистема.

## Быстрый старт

```bash
npm install
npm run dev
```

## Деплой на GitHub Pages

### Автоматически (GitHub Actions)

1. Запушь код в репозиторий на GitHub
2. Зайди в **Settings → Pages**
3. В разделе **Source** выбери **GitHub Actions**
4. При следующем `git push` в ветку `main` — сайт задеплоится автоматически

> ⚠️ В файле `vite.config.js` замени `k8s-lecture-diagrams` на имя твоего репозитория

### Вручную (gh-pages)

```bash
npm run deploy
```

## Структура

```
src/
  App.jsx        # Диаграмма: Service & DNS intro
```
