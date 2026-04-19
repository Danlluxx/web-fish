import Link from "next/link";

export default function NotFound() {
  return (
    <div className="empty-state empty-state--standalone">
      <h1>Страница не найдена</h1>
      <p>Возможно, товар был перенесен или ссылка устарела. Каталог по-прежнему доступен целиком.</p>
      <Link href="/catalog" className="button button--primary">
        Перейти в каталог
      </Link>
    </div>
  );
}
