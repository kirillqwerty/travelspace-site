// Loading and transient failures must never write title/description/robots.
export default function PageLoadState({ failed, retry }) {
  return (
    <div className="section-container pt-32 pb-16" role="status">
      <p>{failed ? "Не удалось обновить данные. Проверьте соединение и попробуйте ещё раз." : "Открываем страницу…"}</p>
      {failed && <button type="button" onClick={retry} className="mt-4 text-[#C2410C] underline">Повторить</button>}
    </div>
  );
}
