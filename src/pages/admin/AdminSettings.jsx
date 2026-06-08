// import { useEffect, useState } from "react";
// import { api } from "@/lib/api";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Textarea } from "@/components/ui/textarea";
// import { Button } from "@/components/ui/button";
// import { toast } from "sonner";

// export default function AdminSettings() {
//   const [data, setData] = useState(null);

//   useEffect(() => {
//     api.get("/admin/settings").then((r) => setData(r.data));
//   }, []);

//   if (!data) return <p>Загрузка…</p>;

//   const update = (k, v) => setData((p) => ({ ...p, [k]: v }));
//   const updateNested = (parent, k, v) =>
//     setData((p) => ({ ...p, [parent]: { ...(p[parent] || {}), [k]: v } }));

//   const save = async (e) => {
//     e.preventDefault();
//     await api.put("/admin/settings", data);
//     toast.success("Настройки сохранены");
//   };

//   return (
//     <div data-testid="admin-settings">
//       <h1 className="font-heading text-3xl">Настройки сайта</h1>
//       <p className="text-sm text-neutral-500 mt-1">
//         Контактные данные, реквизиты, мессенджеры.
//       </p>

//       <form
//         onSubmit={save}
//         className="mt-8 rounded-2xl bg-white border border-neutral-200 p-6 sm:p-8 max-w-3xl space-y-5"
//       >
//         <Group title="Основное">
//           <Field
//             label="Название компании"
//             value={data.company_name}
//             onChange={(v) => update("company_name", v)}
//           />
//           <Field
//             label="Короткое имя"
//             value={data.company_short}
//             onChange={(v) => update("company_short", v)}
//           />
//           <Field
//             label="Юридическое название"
//             value={data.legal_name}
//             onChange={(v) => update("legal_name", v)}
//           />
//           <Field
//             label="УНП"
//             value={data.unp}
//             onChange={(v) => update("unp", v)}
//           />
//         </Group>

//         <Group title="Контакты">
//           <Field
//             label="Телефон (формат)"
//             value={data.phone}
//             onChange={(v) => update("phone", v)}
//           />
//           <Field
//             label="Телефон (для tel:)"
//             value={data.phone_link}
//             onChange={(v) => update("phone_link", v)}
//           />
//           <Field
//             label="Email"
//             value={data.email}
//             onChange={(v) => update("email", v)}
//           />
//           <Field
//             label="Email для заявок"
//             value={data.lead_email}
//             onChange={(v) => update("lead_email", v)}
//           />
//           <Field
//             label="Адрес"
//             value={data.address}
//             onChange={(v) => update("address", v)}
//           />
//           <Field
//             label="Часы работы"
//             value={data.work_hours}
//             onChange={(v) => update("work_hours", v)}
//           />
//         </Group>

//         <Group title="Телефоны в шапке и футере">
//           <div className="sm:col-span-2 space-y-3">
//             <HeaderPhonesField
//               value={data.header_phones || []}
//               onChange={(v) => update("header_phones", v)}
//             />
//           </div>
//         </Group>

//         <Group title="Мессенджеры">
//           <Field
//             label="Viber"
//             value={data.messengers?.viber}
//             onChange={(v) => updateNested("messengers", "viber", v)}
//           />
//           <Field
//             label="Telegram"
//             value={data.messengers?.telegram}
//             onChange={(v) => updateNested("messengers", "telegram", v)}
//           />
//           <Field
//             label="WhatsApp"
//             value={data.messengers?.whatsapp}
//             onChange={(v) => updateNested("messengers", "whatsapp", v)}
//           />
//         </Group>
//         {/*
//         <Group title="Аналитика">
//           <Field label="Yandex Metrika ID" value={data.analytics?.yandex_metrika} onChange={(v) => updateNested("analytics", "yandex_metrika", v)} />
//           <Field label="Google Analytics ID" value={data.analytics?.google_analytics} onChange={(v) => updateNested("analytics", "google_analytics", v)} />
//         </Group> */}

//         <div className="pt-2">
//           <Button
//             type="submit"
//             className="rounded-full bg-[#C2410C] hover:bg-[#9A3412]"
//             data-testid="admin-settings-save"
//           >
//             Сохранить
//           </Button>
//         </div>
//       </form>
//     </div>
//   );
// }

// function Group({ title, children }) {
//   return (
//     <div>
//       <p className="overline text-neutral-500 mb-3">{title}</p>
//       <div className="grid sm:grid-cols-2 gap-3">{children}</div>
//     </div>
//   );
// }

// function HeaderPhonesField({ value = [], onChange }) {
//   const items = value.length
//     ? value
//     : [
//         {
//           label: "Грузия и Дагестан",
//           phone: "636-99-11",
//           link: "+375296369911",
//         },
//         { label: "Питер и Карелия", phone: "636-22-99", link: "+375296362299" },
//       ];

//   const updateItem = (index, patch) => {
//     const next = [...items];
//     next[index] = { ...next[index], ...patch };
//     onChange(next);
//   };

//   const addItem = () =>
//     onChange([...items, { label: "", phone: "", link: "" }]);

//   const removeItem = (index) =>
//     onChange(items.filter((_, itemIndex) => itemIndex !== index));

//   return (
//     <div className="space-y-3">
//       {items.map((item, index) => (
//         <div
//           key={index}
//           className="grid gap-2 rounded-xl border border-neutral-200 p-3 sm:grid-cols-[1fr_1fr_1fr_auto]"
//         >
//           <Field
//             label="Подпись"
//             value={item.label}
//             onChange={(v) => updateItem(index, { label: v })}
//           />
//           <Field
//             label="Номер на сайте"
//             value={item.phone}
//             onChange={(v) => updateItem(index, { phone: v })}
//           />
//           <Field
//             label="Номер для tel:"
//             value={item.link}
//             onChange={(v) => updateItem(index, { link: v })}
//           />
//           <div className="flex items-end">
//             <Button
//               type="button"
//               variant="outline"
//               onClick={() => removeItem(index)}
//               className="w-full"
//             >
//               Удалить
//             </Button>
//           </div>
//         </div>
//       ))}

//       <Button type="button" variant="outline" onClick={addItem}>
//         Добавить телефон
//       </Button>
//     </div>
//   );
// }

// function Field({ label, value, onChange }) {
//   return (
//     <div>
//       <Label className="text-xs">{label}</Label>
//       <Input
//         value={value ?? ""}
//         onChange={(e) => onChange(e.target.value)}
//         className="mt-1"
//       />
//     </div>
//   );
// }
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function AdminSettings() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get("/admin/settings").then((r) => setData(r.data));
  }, []);

  if (!data) return <p>Загрузка…</p>;

  const update = (k, v) => setData((p) => ({ ...p, [k]: v }));
  const updateNested = (parent, k, v) =>
    setData((p) => ({ ...p, [parent]: { ...(p[parent] || {}), [k]: v } }));

  const save = async (e) => {
    e.preventDefault();
    await api.put("/admin/settings", data);
    toast.success("Настройки сохранены");
  };

  return (
    <div data-testid="admin-settings">
      <h1 className="font-heading text-3xl">Настройки сайта</h1>
      <p className="text-sm text-neutral-500 mt-1">
        Контактные данные, реквизиты, мессенджеры.
      </p>

      <form
        onSubmit={save}
        className="mt-8 rounded-2xl bg-white border border-neutral-200 p-6 sm:p-8 max-w-3xl space-y-5"
      >
        <Group title="Основное">
          <Field
            label="Название компании"
            value={data.company_name}
            onChange={(v) => update("company_name", v)}
          />
          <Field
            label="Короткое имя"
            value={data.company_short}
            onChange={(v) => update("company_short", v)}
          />
          <Field
            label="Юридическое название"
            value={data.legal_name}
            onChange={(v) => update("legal_name", v)}
          />
          <Field
            label="УНП"
            value={data.unp}
            onChange={(v) => update("unp", v)}
          />
        </Group>

        <Group title="Контакты">
          <Field
            label="Телефон (формат)"
            value={data.phone}
            onChange={(v) => update("phone", v)}
          />
          <Field
            label="Телефон (для tel:)"
            value={data.phone_link}
            onChange={(v) => update("phone_link", v)}
          />
          <Field
            label="Email"
            value={data.email}
            onChange={(v) => update("email", v)}
          />
          <Field
            label="Email для заявок"
            value={data.lead_email}
            onChange={(v) => update("lead_email", v)}
          />
          <Field
            label="Адрес"
            value={data.address}
            onChange={(v) => update("address", v)}
          />
          <Field
            label="Часы работы"
            value={data.work_hours}
            onChange={(v) => update("work_hours", v)}
          />
        </Group>

        <Group title="Телефоны в шапке и футере">
          <div className="sm:col-span-2 space-y-3">
            <HeaderPhonesField
              value={data.header_phones || []}
              onChange={(v) => update("header_phones", v)}
            />
          </div>
        </Group>

        <Group title="Мессенджеры">
          <Field
            label="Viber"
            value={data.messengers?.viber}
            onChange={(v) => updateNested("messengers", "viber", v)}
          />
          <Field
            label="Telegram"
            value={data.messengers?.telegram}
            onChange={(v) => updateNested("messengers", "telegram", v)}
          />
          <Field
            label="WhatsApp"
            value={data.messengers?.whatsapp}
            onChange={(v) => updateNested("messengers", "whatsapp", v)}
          />
          <div className="sm:col-span-2">
            <SocialButtonsField
              value={data.social_buttons || []}
              onChange={(v) => update("social_buttons", v)}
            />
          </div>
        </Group>
        {/* 
        <Group title="Аналитика">
          <Field label="Yandex Metrika ID" value={data.analytics?.yandex_metrika} onChange={(v) => updateNested("analytics", "yandex_metrika", v)} />
          <Field label="Google Analytics ID" value={data.analytics?.google_analytics} onChange={(v) => updateNested("analytics", "google_analytics", v)} />
        </Group> */}

        <div className="pt-2">
          <Button
            type="submit"
            className="rounded-full bg-[#C2410C] hover:bg-[#9A3412]"
            data-testid="admin-settings-save"
          >
            Сохранить
          </Button>
        </div>
      </form>
    </div>
  );
}

function Group({ title, children }) {
  return (
    <div>
      <p className="overline text-neutral-500 mb-3">{title}</p>
      <div className="grid sm:grid-cols-2 gap-3">{children}</div>
    </div>
  );
}

function HeaderPhonesField({ value = [], onChange }) {
  const items = value.length
    ? value
    : [
        {
          label: "Грузия и Дагестан",
          phone: "636-99-11",
          link: "+375296369911",
        },
        { label: "Питер и Карелия", phone: "636-22-99", link: "+375296362299" },
      ];

  const updateItem = (index, patch) => {
    const next = [...items];
    next[index] = { ...next[index], ...patch };
    onChange(next);
  };

  const addItem = () =>
    onChange([...items, { label: "", phone: "", link: "" }]);

  const removeItem = (index) =>
    onChange(items.filter((_, itemIndex) => itemIndex !== index));

  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div
          key={index}
          className="grid gap-2 rounded-xl border border-neutral-200 p-3 sm:grid-cols-[1fr_1fr_1fr_auto]"
        >
          <Field
            label="Подпись"
            value={item.label}
            onChange={(v) => updateItem(index, { label: v })}
          />
          <Field
            label="Номер на сайте"
            value={item.phone}
            onChange={(v) => updateItem(index, { phone: v })}
          />
          <Field
            label="Номер для tel:"
            value={item.link}
            onChange={(v) => updateItem(index, { link: v })}
          />
          <div className="flex items-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => removeItem(index)}
              className="w-full"
            >
              Удалить
            </Button>
          </div>
        </div>
      ))}

      <Button type="button" variant="outline" onClick={addItem}>
        Добавить телефон
      </Button>
    </div>
  );
}

function SocialButtonsField({ value = [], onChange }) {
  const items = value.length
    ? value
    : [
        { label: "Viber", url: "", icon: "", color: "#7360F2", active: true },
        {
          label: "Telegram",
          url: "",
          icon: "",
          color: "#0088CC",
          active: true,
        },
        {
          label: "WhatsApp",
          url: "",
          icon: "",
          color: "#25D366",
          active: true,
        },
      ];

  const updateItem = (index, patch) => {
    const next = [...items];
    next[index] = { ...next[index], ...patch };
    onChange(next);
  };

  const addItem = () =>
    onChange([
      ...items,
      { label: "", url: "", icon: "", color: "#111827", active: true },
    ]);

  const removeItem = (index) =>
    onChange(items.filter((_, itemIndex) => itemIndex !== index));

  const uploadIcon = async (index, file) => {
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post("/admin/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    updateItem(index, { icon: response.data.url });
    toast.success("Иконка загружена");
  };

  return (
    <div className="space-y-3">
      <div>
        <Label>Иконки и ссылки мессенджеров/соцсетей</Label>
        <p className="mt-1 text-xs text-neutral-500">
          Можно загрузить свою привычную иконку и указать актуальную ссылку.
          Если список заполнен, шапка использует именно его.
        </p>
      </div>

      {items.map((item, index) => (
        <div
          key={index}
          className="grid gap-2 rounded-xl border border-neutral-200 p-3 sm:grid-cols-[1fr_1.5fr_120px_160px_auto]"
        >
          <Field
            label="Название"
            value={item.label}
            onChange={(v) => updateItem(index, { label: v })}
          />
          <Field
            label="Ссылка"
            value={item.url}
            onChange={(v) => updateItem(index, { url: v })}
          />
          <Field
            label="Цвет"
            value={item.color}
            onChange={(v) => updateItem(index, { color: v })}
          />
          <div>
            <Label className="text-xs">Иконка</Label>
            <div className="mt-1 flex items-center gap-2">
              {item.icon && (
                <img
                  src={
                    item.icon.startsWith("/uploads")
                      ? `${process.env.REACT_APP_BACKEND_URL || ""}${item.icon}`
                      : item.icon
                  }
                  alt=""
                  className="size-8 rounded-full object-contain"
                />
              )}
              <label className="cursor-pointer rounded-md border border-neutral-300 px-3 py-2 text-xs hover:bg-neutral-50">
                Загрузить
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => uploadIcon(index, e.target.files?.[0])}
                />
              </label>
            </div>
          </div>
          <div className="flex items-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => removeItem(index)}
              className="w-full"
            >
              Удалить
            </Button>
          </div>
        </div>
      ))}

      <Button type="button" variant="outline" onClick={addItem}>
        Добавить иконку
      </Button>
    </div>
  );
}

function Field({ label, value, onChange }) {
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <Input
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1"
      />
    </div>
  );
}
