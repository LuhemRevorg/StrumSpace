import React, { useState } from 'react';
import styles from '../styles/Catalog.module.css';
import mockSongs from '../assets/mockSongs'; // Assuming you have a mock data file

function Catalog() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');

  const filteredSongs = mockSongs.filter(song =>
    (song.title.toLowerCase().includes(search.toLowerCase()) ||
    song.artist.toLowerCase().includes(search.toLowerCase())) &&
    (filter === 'All' || song.difficulty === filter)
  );

  return (
    <div className={styles.catalogPage}>
      <div className={styles.topBar}>
        <input
          type="text"
          placeholder="Search songs or artists..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={styles.searchBar}
        />
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className={styles.filterDropdown}
        >
          <option value="All">All Levels</option>
          <option value="Easy">Easy</option>
          <option value="Medium">Medium</option>
          <option value="Hard">Hard</option>
        </select>
      </div>

      <div className={styles.grid}>
        {filteredSongs.map((song) => (
          <div key={song.id} className={styles.card}>
            <img src={song.cover} alt={song.title} className={styles.cover} />
            <h3 className={styles.title}>{song.title}</h3>
            <p className={styles.artist}>{song.artist}</p>
            <span className={`${styles.level} ${styles[song.difficulty.toLowerCase()]}`}>
              {song.difficulty}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Catalog;
