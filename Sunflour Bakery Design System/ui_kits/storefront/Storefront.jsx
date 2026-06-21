// Sunflour storefront — layout + commerce + checkout components.
const { useState: useS, useEffect: useE, useMemo: useM } = React;

// ---------- Header ----------
function Header({ cartCount, onNav, active }) {
  const nav = [
    { key: "home", label: "Home" },
    { key: "menu", label: "Menu" },
    { key: "about", label: "About" },
    { key: "contact", label: "Contact" },
    { key: "reviews", label: "Reviews" },
  ];
  return (
    <header style={{
      position: "sticky", top: 0, zIndex: 30, borderBottom: "1px solid var(--color-border)",
      background: "color-mix(in srgb, var(--color-bg) 92%, transparent)", backdropFilter: "blur(8px)",
    }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "12px 16px" }}>
        <button onClick={() => onNav("home")} style={{ display: "flex", alignItems: "center", gap: 10, background: "none", border: 0, cursor: "pointer" }}>
          <img src="../../assets/logo.png" alt="Sunflour Bakery" style={{ height: 40, width: 40, objectFit: "contain", borderRadius: "var(--radius-sm)" }} />
          <span style={{ fontSize: 16, fontWeight: 800, color: "var(--color-text)" }}>Sunflour Bakery</span>
        </button>
        <nav style={{ display: "flex", gap: 2 }} className="sf-desk-nav">
          {nav.map((n) => (
            <button key={n.key} onClick={() => onNav(n.key)} style={{
              minHeight: 40, borderRadius: "var(--radius-sm)", padding: "0 12px", border: 0, cursor: "pointer",
              background: active === n.key ? "var(--color-surface-soft)" : "transparent",
              color: active === n.key ? "var(--color-text)" : "var(--color-text-muted)",
              fontSize: 14, fontWeight: 600,
            }}>{n.label}</button>
          ))}
        </nav>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Button variant="secondary" size="sm" icon={<Icon name="user-round" size={16} />} onClick={() => onNav("account")}>Account</Button>
          <Button size="sm" icon={<Icon name="shopping-bag" size={16} />} onClick={() => onNav("cart")}>
            Cart{cartCount ? " · " + cartCount : ""}
          </Button>
        </div>
      </div>
    </header>
  );
}

// ---------- Hero ----------
function Hero({ onNav }) {
  return (
    <section style={{ position: "relative", overflow: "hidden", minHeight: 460 }}>
      <img src="../../assets/menu.jpg" alt="Sunflour menu selection" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,.65), rgba(0,0,0,.35) 60%, var(--color-bg))" }} />
      <div style={{ position: "relative", maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "flex-end", minHeight: 460, padding: "64px 16px 40px" }}>
        <div style={{ maxWidth: 560, color: "#fff" }}>
          <p className="sf-eyebrow" style={{ color: "#fff", margin: 0 }}>WELCOME TO SUNFLOUR</p>
          <h1 style={{ margin: "12px 0 0", fontSize: 44, fontWeight: 800, lineHeight: 1.12, letterSpacing: "-.01em" }}>
            Fresh bakery orders with clear checkout and invoice access.
          </h1>
          <p style={{ margin: "16px 0 0", fontSize: 16, lineHeight: 1.6, color: "rgba(255,255,255,.85)" }}>
            Browse the menu, choose pickup or delivery, see fees before ordering, then pay by Moniepoint transfer and send proof on WhatsApp.
          </p>
          <div style={{ display: "flex", gap: 12, marginTop: 24, flexWrap: "wrap" }}>
            <Button size="lg" icon={<Icon name="arrow-right" size={16} />} onClick={() => onNav("menu")}>View menu</Button>
            <Button size="lg" variant="ghost" style={{ color: "#fff", border: "1px solid rgba(255,255,255,.7)" }} onClick={() => onNav("cart")}>Review cart</Button>
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------- Value props strip ----------
function ValueProps() {
  const items = [
    { icon: "clock", title: "Fast browsing", body: "Find items quickly from the official menu." },
    { icon: "truck", title: "Clear delivery", body: "Base fee and 6 PM surcharge are shown separately." },
    { icon: "receipt-text", title: "Invoice ready", body: "Every order gets a traceable invoice immediately." },
    { icon: "shield-check", title: "Manual verification", body: "Payment is confirmed only after staff review." },
  ];
  return (
    <section style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 16, padding: "32px 16px" }}>
      {items.map((it) => (
        <article key={it.title} style={{ borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", background: "var(--color-surface)", padding: 16 }}>
          <Icon name={it.icon} size={20} color="var(--color-primary)" />
          <h2 style={{ margin: "12px 0 0", fontSize: 16, fontWeight: 800 }}>{it.title}</h2>
          <p style={{ margin: "4px 0 0", fontSize: 14, lineHeight: 1.5, color: "var(--color-text-muted)" }}>{it.body}</p>
        </article>
      ))}
    </section>
  );
}

// ---------- Product image well ----------
function ProductImage({ product, ratio = "4 / 3" }) {
  return (
    <div style={{ aspectRatio: ratio, background: "var(--color-surface-soft)", overflow: "hidden", display: "grid", placeItems: "center" }}>
      {product.image
        ? <img src={product.image} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        : <span style={{ fontSize: 13, fontWeight: 700, color: "var(--color-text-muted)" }}>Sunflour Bakery</span>}
    </div>
  );
}

// ---------- Product card ----------
function ProductCard({ product, onOpen, onAdd }) {
  const soldOut = product.status === "OUT_OF_STOCK";
  return (
    <article style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", boxShadow: "var(--shadow-soft)", overflow: "hidden", display: "grid" }}>
      <button onClick={() => onOpen(product)} style={{ border: 0, padding: 0, background: "none", cursor: "pointer" }}>
        <ProductImage product={product} />
      </button>
      <div style={{ display: "grid", gap: 10, padding: 14 }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {product.popular ? <Badge tone="warning">Popular</Badge> : null}
          <StatusPill status={product.status} />
        </div>
        <button onClick={() => onOpen(product)} style={{ textAlign: "left", border: 0, background: "none", padding: 0, cursor: "pointer", fontSize: 18, fontWeight: 800, lineHeight: 1.2, color: "var(--color-text)" }}>
          {product.name}
        </button>
        <p style={{ margin: 0, fontSize: 13, color: "var(--color-text-muted)", lineHeight: 1.45, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{product.desc}</p>
        <div style={{ fontSize: 14, color: "var(--color-text-muted)" }}>
          {product.from ? "From " : ""}<Price amount={product.price} style={{ fontSize: 16 }} />
        </div>
        <Button icon={<Icon name="shopping-bag" size={16} />} disabled={soldOut} onClick={() => onAdd(product)}>
          {soldOut ? "Out of stock" : "Add to cart"}
        </Button>
      </div>
    </article>
  );
}

// ---------- Menu browser (category filter + search) ----------
function MenuBrowser({ menu, onOpen, onAdd }) {
  const [cat, setCat] = useS("all");
  const [q, setQ] = useS("");
  const products = useM(() => {
    const nq = q.trim().toLowerCase();
    return menu.products.filter((p) => (cat === "all" || p.category === cat) && (!nq || (p.name + " " + p.desc).toLowerCase().includes(nq)));
  }, [cat, q, menu]);
  const cats = [{ slug: "all", name: "All" }, ...menu.categories];
  return (
    <section style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 16px", display: "grid", gap: 20 }}>
      <div>
        <p className="sf-eyebrow" style={{ margin: 0 }}>OUR MENU</p>
        <h1 style={{ margin: "4px 0 0", fontSize: 30, fontWeight: 800 }}>Browse the menu</h1>
      </div>
      <div style={{ display: "grid", gap: 14, gridTemplateColumns: "minmax(0,1fr) 280px", alignItems: "end" }} className="sf-menu-controls">
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {cats.map((c) => (
            <button key={c.slug} onClick={() => setCat(c.slug)} style={{
              minHeight: 40, padding: "0 14px", borderRadius: "var(--radius-pill)", cursor: "pointer",
              border: "1px solid " + (cat === c.slug ? "var(--color-primary)" : "var(--color-border)"),
              background: cat === c.slug ? "var(--color-primary)" : "var(--color-surface)",
              color: cat === c.slug ? "#fff" : "var(--color-text)", fontSize: 13, fontWeight: 700,
            }}>{c.name}</button>
          ))}
        </div>
        <div style={{ position: "relative" }}>
          <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--color-text-soft)" }}><Icon name="search" size={16} /></span>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search the menu" style={{
            width: "100%", minHeight: 44, borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)",
            background: "var(--color-surface)", padding: "0 12px 0 36px", font: "inherit", color: "var(--color-text)", outline: "none",
          }} />
        </div>
      </div>
      {products.length === 0
        ? <EmptyState icon="search" title="No matches" body="Try a different category or search term." />
        : <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(230px,1fr))", gap: 16 }}>
            {products.map((p) => <ProductCard key={p.id} product={p} onOpen={onOpen} onAdd={onAdd} />)}
          </div>}
    </section>
  );
}

// ---------- Empty state ----------
function EmptyState({ icon = "package", title, body, action }) {
  return (
    <div style={{ display: "grid", placeItems: "center", gap: 8, textAlign: "center", padding: "48px 16px", border: "1px dashed var(--color-border-strong)", borderRadius: "var(--radius-md)", background: "var(--color-surface)" }}>
      <span style={{ color: "var(--color-text-soft)" }}><Icon name={icon} size={28} /></span>
      <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>{title}</h3>
      <p style={{ margin: 0, fontSize: 14, color: "var(--color-text-muted)", maxWidth: 340 }}>{body}</p>
      {action}
    </div>
  );
}

// ---------- Product detail ----------
function ProductDetail({ product, onBack, onAdd }) {
  const [qty, setQty] = useS(1);
  const soldOut = product.status === "OUT_OF_STOCK";
  return (
    <section style={{ maxWidth: 1100, margin: "0 auto", padding: "20px 16px", display: "grid", gap: 20 }}>
      <button onClick={onBack} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "none", border: 0, cursor: "pointer", color: "var(--color-text-muted)", fontWeight: 600, fontSize: 14, justifySelf: "start" }}>
        <Icon name="arrow-left" size={16} /> Back to menu
      </button>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, alignItems: "start" }} className="sf-detail-grid">
        <div style={{ borderRadius: "var(--radius-lg)", overflow: "hidden", border: "1px solid var(--color-border)" }}>
          <ProductImage product={product} ratio="1 / 1" />
        </div>
        <div style={{ display: "grid", gap: 16 }}>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {product.popular ? <Badge tone="warning">Popular</Badge> : null}
            <StatusPill status={product.status} />
          </div>
          <h1 style={{ margin: 0, fontSize: 30, fontWeight: 800, lineHeight: 1.15 }}>{product.name}</h1>
          <Price amount={product.price} style={{ fontSize: 28 }} />
          <p style={{ margin: 0, fontSize: 15, lineHeight: 1.6, color: "var(--color-text-muted)" }}>{product.desc}</p>
          <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap", paddingTop: 4 }}>
            <QuantityStepper value={qty} onChange={setQty} />
            <Button size="lg" icon={<Icon name="shopping-bag" size={18} />} disabled={soldOut} onClick={() => onAdd(product, qty)}>
              {soldOut ? "Out of stock" : "Add " + qty + " to cart"}
            </Button>
          </div>
          <div style={{ marginTop: 4, padding: 14, borderRadius: "var(--radius-md)", background: "var(--color-surface-soft)", border: "1px solid var(--color-border)", fontSize: 13, color: "var(--color-text-muted)", lineHeight: 1.55 }}>
            <strong style={{ color: "var(--color-text)" }}>Pickup or delivery.</strong> Delivery base fee and any 6 PM surcharge are shown clearly at checkout before you order.
          </div>
        </div>
      </div>
    </section>
  );
}

Object.assign(window, { Header, Hero, ValueProps, ProductImage, ProductCard, MenuBrowser, EmptyState, ProductDetail });
