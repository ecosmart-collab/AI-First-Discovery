export default function Icon({name,size=20,...props}) {
  const paths={
    grid:<><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></>,
    brief:<><rect x="3" y="7" width="18" height="14" rx="2"/><path d="M8 7V4h8v3M3 12a25 25 0 0 0 18 0M10 12v3h4v-3"/></>,
    discover:<><path d="M9 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-4M8 9h5M8 13h3M8 17h6"/><circle cx="17" cy="7" r="4"/><path d="m20 10 2 2"/></>,
    bolt:<path d="m13 2-9 12h7l-1 8 10-13h-7z"/>,
    chart:<><path d="M4 3v17h17M8 15v-4M13 15V6M18 15V9"/></>,
    file:<><path d="M14 2H5v20h14V7zM14 2v6h5M8 12h8M8 16h8"/></>,
    book:<><path d="M12 5C8 2 3 3 3 3v16s5-1 9 2c4-3 9-2 9-2V3s-5-1-9 2zM12 5v16"/></>,
    settings:<><path d="m10 3-.6 2.1-2 .9-2-.6L3 9l1.5 1.5v3L3 15l2.4 3.6 2-.6 2 .9.6 2.1h4l.6-2.1 2-.9 2 .6L21 15l-1.5-1.5v-3L21 9l-2.4-3.6-2 .6-2-.9L14 3z"/><circle cx="12" cy="12" r="3"/></>,
    plus:<path d="M12 5v14M5 12h14"/>,
    arrow:<path d="M4 12h16m-6-6 6 6-6 6"/>,
    chevron:<path d="m9 5 7 7-7 7"/>,
    down:<path d="m6 9 6 6 6-6"/>,
    search:<><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></>,
    check:<path d="m5 12 4 4L19 6"/>,
    lock:<><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V6a4 4 0 0 1 8 0v4M12 14v3"/></>,
    clock:<><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    trend:<path d="m3 17 6-6 4 4 8-10M15 5h6v6"/>,
    users:<><circle cx="9" cy="8" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3M16 5a3 3 0 0 1 0 6M18 15a5 5 0 0 1 3 5"/></>,
    spark:<><path d="m12 3 2.6 6.4L21 12l-6.4 2.6L12 21l-2.6-6.4L3 12l6.4-2.6zM20 2v4M18 4h4"/></>,
    close:<path d="m6 6 12 12M6 18 18 6"/>,
    logout:<><path d="M9 4H4v16h5M9 12h12m-5-5 5 5-5 5"/></>,
    download:<><path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/></>,
    edit:<><path d="m15 4 5 5M4 20l5-1L21 7l-5-5L4 14z"/></>,
    trash:<><path d="M3 6h18M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7M14 10v7"/></>,
    shield:<><path d="M12 2 3 6v6c0 5 9 10 9 10s9-5 9-10V6z"/><path d="m8 12 3 3 5-6"/></>,
    menu:<path d="M4 6h16M4 12h16M4 18h16"/>,
    info:<><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7v1"/></>
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>{paths[name]||paths.grid}</svg>;
}
