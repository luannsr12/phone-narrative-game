import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/theme';
import { useGameStore, selectPublishedPosts, selectPublishedNews, selectNewsArticle, selectAds } from '@/store/gameStore';
import { story } from '@/story';
import { getSocialProfile } from '@/utils/social';
import { mediaUrl } from '@/utils/media';
import { newsSiteUrl } from '@/utils/links';
import { AdBanner } from '@/components/ads/AdBanner';
import type { Ad } from '@/types/story';
import type { Screen } from '@/navigation/types';

interface Results {
  news: typeof story.news[string][];
  evidence: { id: string }[];
  posts: ReturnType<typeof selectPublishedPosts>;
  images: { id: string; url: string; title: string }[];
}

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

/** Pick a stable ad for a given slot, so the same page always shows the same one. */
function pickAd(ads: Ad[], seed: string): Ad | null {
  if (!ads.length) return null;
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return ads[h % ads.length];
}

/** Fictional address of an article's website (shared with chat link labels). */
const siteUrl = newsSiteUrl;

/**
 * "Ravex" — the phone's fictional browser/search engine. It only indexes
 * what the player already has access to (published news, collected evidence,
 * visible Mural posts), so search never spoils the investigation. With a
 * `newsId` param it opens straight on that article's fictional website.
 */
export function BrowserScreen({ navigation, route }: Screen<'Browser'>) {
  const state = useGameStore((s) => s.state);
  // The search engine indexes PUBLIC posts (published), follow-independent.
  const posts = useGameStore((s) => selectPublishedPosts(s.state));
  const [query, setQuery] = useState('');
  const q = norm(query.trim());

  // The article "page" currently open (deep-linked from Notícias, or tapped
  // inside the browser itself).
  const [articleId, setArticleId] = useState(route.params?.newsId);
  useEffect(() => setArticleId(route.params?.newsId), [route.params?.newsId]);

  // Opening a real article registers a "view" — fires any armed `viewNews` event.
  const viewNews = useGameStore((s) => s.viewNews);
  useEffect(() => {
    const cur = useGameStore.getState().state;
    if (articleId && cur && selectNewsArticle(cur, articleId)) viewNews(articleId);
  }, [articleId, viewNews]);

  const publishedNews = useGameStore((s) => selectPublishedNews(s.state));
  const ads = useMemo(() => selectAds('browser'), []);

  const openAd = (ad: Ad) =>
    navigation.push('Browser', {
      page: { url: ad.url ?? '', title: ad.brand, body: ad.caption },
    });

  const results: Results | null = useMemo(() => {
    if (!state || !q) return null;
    const hit = (...fields: (string | undefined)[]) =>
      fields.some((f) => f && norm(f).includes(q));

    const news = publishedNews.filter((n) => hit(n.headline, n.body, n.outlet));
    const evidence = state.evidence.filter((i) => {
      const ev = story.evidence[i.id];
      return ev && hit(ev.title, ev.description, ev.body, ev.caseRelevance);
    });
    const matchedPosts = posts.filter((p) => {
      const author = getSocialProfile(p.author);
      return hit(p.caption, author?.name, p.author);
    });
    const images = state.evidence
      .map((i) => story.evidence[i.id])
      .filter((ev) => ev && (ev.kind === 'photo' || ev.kind === 'screenshot') && mediaUrl(ev.media, ev.url))
      .filter((ev) => hit(ev!.title, ev!.description))
      .map((ev) => ({ id: ev!.id, url: mediaUrl(ev!.media, ev!.url)!, title: ev!.title }));

    return { news, evidence, posts: matchedPosts, images };
  }, [state, q, publishedNews, posts]);

  if (!state) return null;

  const article = selectNewsArticle(state, articleId);
  // Authored fictional page (a link a character sent in chat).
  const extPage = !article ? route.params?.page : undefined;
  const pageDomain = extPage?.url.replace(/^https?:\/\//, '').split('/')[0] ?? '';

  const goBack = () => {
    // Article opened from inside the browser: back returns to the search page.
    // Article the browser was opened ON (deep link from Notícias) — or no
    // article at all: back leaves the browser.
    if (article && articleId !== route.params?.newsId) {
      setArticleId(route.params?.newsId);
      return;
    }
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.navigate('Home');
  };

  const empty =
    results &&
    !results.news.length &&
    !results.evidence.length &&
    !results.posts.length &&
    !results.images.length;

  return (
    <View style={styles.bg}>
      {/* Browser chrome */}
      <View style={styles.chrome}>
        <Pressable onPress={goBack} hitSlop={10}>
          <Ionicons name="arrow-back" size={21} color={theme.colors.text} />
        </Pressable>
        <View style={styles.urlBar}>
          {article || extPage ? (
            <>
              <Ionicons name="lock-closed" size={12} color={theme.colors.textFaint} />
              <Text style={styles.urlText} numberOfLines={1}>
                {article ? siteUrl(article) : extPage!.url.replace(/^https?:\/\//, '')}
              </Text>
            </>
          ) : (
            <>
              <Ionicons name="search" size={14} color={theme.colors.textFaint} />
              <TextInput
                style={styles.urlInput}
                value={query}
                onChangeText={setQuery}
                placeholder="Pesquisar no Ravex"
                placeholderTextColor={theme.colors.textFaint}
                returnKeyType="search"
                autoCorrect={false}
              />
              {query ? (
                <Pressable onPress={() => setQuery('')} hitSlop={8}>
                  <Ionicons name="close-circle" size={15} color={theme.colors.textFaint} />
                </Pressable>
              ) : null}
            </>
          )}
        </View>
        <View style={styles.tabBox}>
          <Text style={styles.tabCount}>1</Text>
        </View>
        <Ionicons name="ellipsis-vertical" size={16} color={theme.colors.textDim} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {article ? (
          // ---- the article's fictional website ----
          <View>
            <View style={styles.siteMast}>
              <Text style={styles.siteName}>{article.outlet}</Text>
              <Text style={styles.siteTag}>Ravenwood e região</Text>
            </View>
            <Text style={styles.articleHeadline}>{article.headline}</Text>
            <Text style={styles.articleMeta}>Da redação · {article.date}</Text>
            {mediaUrl(article.imageMedia, article.imageUrl) ? (
              <Image source={{ uri: mediaUrl(article.imageMedia, article.imageUrl) }} style={styles.articleImage} />
            ) : null}
            {article.body.split(/\n{2,}/).map((para, i) => (
              <Text key={i} style={styles.articlePara}>
                {para}
              </Text>
            ))}
            {(() => {
              const ad = pickAd(ads, article.id);
              return ad ? <AdBanner ad={ad} onPress={() => openAd(ad)} /> : null;
            })()}
            <View style={styles.articleFoot}>
              <Text style={styles.articleFootText}>
                © {article.outlet} — reprodução autorizada apenas com crédito.
              </Text>
            </View>
          </View>
        ) : extPage ? (
          // ---- generic fictional page (link sent in chat) ----
          <View>
            <View style={styles.siteMast}>
              <Text style={styles.siteName}>{pageDomain}</Text>
            </View>
            {extPage.title ? <Text style={styles.articleHeadline}>{extPage.title}</Text> : null}
            {extPage.image ? (
              <Image source={{ uri: extPage.image }} style={[styles.articleImage, { marginTop: 14 }]} />
            ) : null}
            {(extPage.body ?? '')
              .split(/\n{2,}/)
              .filter(Boolean)
              .map((para, i) => (
                <Text key={i} style={[styles.articlePara, i === 0 && { marginTop: 14 }]}>
                  {para}
                </Text>
              ))}
            {!extPage.body ? (
              <Text style={[styles.articlePara, { marginTop: 14 }]}>
                Não foi possível carregar todo o conteúdo desta página.
              </Text>
            ) : null}
          </View>
        ) : !q ? (
          // ---- homepage: logo + news portal ----
          <>
            <View style={styles.logoWrap}>
              <Text style={styles.logo}>
                <Text style={{ color: '#5BD6C0' }}>R</Text>
                <Text style={{ color: '#E4C56C' }}>a</Text>
                <Text style={{ color: '#E4577B' }}>v</Text>
                <Text style={{ color: '#6C8AE4' }}>e</Text>
                <Text style={{ color: '#BA68C8' }}>x</Text>
              </Text>
              <Text style={styles.tagline}>a busca de Ravenwood</Text>
            </View>

            {(() => {
              const ad = pickAd(ads, 'home');
              return ad ? <AdBanner ad={ad} onPress={() => openAd(ad)} /> : null;
            })()}

            <Text style={styles.sectionTitle}>Notícias para você</Text>
            {publishedNews.length === 0 ? (
              <Text style={styles.emptyText}>Nenhuma matéria disponível na sua região.</Text>
            ) : (
              publishedNews.map((n) => (
                <Pressable
                  key={n.id}
                  style={styles.newsCard}
                  onPress={() => setArticleId(n.id)}
                >
                  {mediaUrl(n.imageMedia, n.imageUrl) ? (
                    <Image source={{ uri: mediaUrl(n.imageMedia, n.imageUrl) }} style={styles.newsThumb} />
                  ) : null}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.newsOutlet}>
                      {n.outlet} · {n.date}
                    </Text>
                    <Text style={styles.newsHeadline} numberOfLines={2}>
                      {n.headline}
                    </Text>
                  </View>
                </Pressable>
              ))
            )}
          </>
        ) : empty ? (
          <View style={styles.noResults}>
            <Ionicons name="search" size={34} color={theme.colors.textFaint} />
            <Text style={styles.emptyText}>Nenhum resultado para “{query.trim()}”.</Text>
          </View>
        ) : (
          // ---- search results, grouped like a real engine ----
          <>
            {results!.images.length ? (
              <>
                <Text style={styles.sectionTitle}>Imagens</Text>
                <View style={styles.imageRow}>
                  {results!.images.map((img) => (
                    <Pressable
                      key={img.id}
                      onPress={() => navigation.navigate('FileDetail', { evidenceId: img.id })}
                    >
                      <Image source={{ uri: img.url }} style={styles.imageCell} />
                    </Pressable>
                  ))}
                </View>
              </>
            ) : null}

            {results!.news.map((n) => (
              <Pressable key={n.id} style={styles.result} onPress={() => setArticleId(n.id)}>
                <Text style={styles.resultUrl}>{siteUrl(n)}</Text>
                <Text style={styles.resultTitle}>{n.headline}</Text>
                <Text style={styles.resultSnippet} numberOfLines={2}>
                  {n.body}
                </Text>
              </Pressable>
            ))}

            {results!.evidence.map((i) => {
              const ev = story.evidence[i.id];
              if (!ev) return null;
              return (
                <Pressable
                  key={i.id}
                  style={styles.result}
                  onPress={() => navigation.navigate('FileDetail', { evidenceId: i.id })}
                >
                  <Text style={styles.resultUrl}>arquivos.local · seu dispositivo</Text>
                  <Text style={styles.resultTitle}>{ev.title}</Text>
                  <Text style={styles.resultSnippet} numberOfLines={2}>
                    {ev.description}
                  </Text>
                </Pressable>
              );
            })}

            {results!.posts.map((p) => {
              const author = getSocialProfile(p.author);
              return (
                <Pressable key={p.id} style={styles.result} onPress={() => navigation.navigate('Social')}>
                  <Text style={styles.resultUrl}>mural.app · @{p.author}</Text>
                  <Text style={styles.resultTitle}>{author?.name ?? p.author} no Mural</Text>
                  <Text style={styles.resultSnippet} numberOfLines={2}>
                    {p.caption}
                  </Text>
                </Pressable>
              );
            })}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: theme.colors.bg },
  chrome: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  urlBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: 20,
    paddingHorizontal: 12,
    height: 38,
  },
  urlInput: { flex: 1, color: theme.colors.text, fontSize: 14, padding: 0 },
  urlText: { flex: 1, color: theme.colors.textDim, fontSize: 13.5 },
  tabBox: {
    width: 22,
    height: 22,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: theme.colors.textDim,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabCount: { color: theme.colors.textDim, fontSize: 11, fontWeight: '700' },

  content: { padding: 16, paddingBottom: 30 },
  logoWrap: { alignItems: 'center', marginVertical: 26 },
  logo: { fontSize: 42, fontWeight: '800', letterSpacing: 1 },
  tagline: { color: theme.colors.textFaint, fontSize: 12, marginTop: 4 },

  sectionTitle: { color: theme.colors.textDim, fontSize: 12.5, fontWeight: '700', letterSpacing: 0.5, marginBottom: 10, marginTop: 6 },

  newsCard: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: 12,
    marginBottom: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
  },
  newsThumb: { width: 64, height: 64, borderRadius: theme.radius.sm, backgroundColor: theme.colors.surfaceHigh },
  newsOutlet: { color: theme.colors.accent, fontSize: 10.5, fontWeight: '700' },
  newsHeadline: { color: theme.colors.text, fontSize: 14.5, fontWeight: '700', marginTop: 3, lineHeight: 19 },

  noResults: { alignItems: 'center', marginTop: 60, gap: 12 },
  emptyText: { color: theme.colors.textFaint, fontSize: 13.5, textAlign: 'center' },

  result: { marginBottom: 18 },
  resultUrl: { color: theme.colors.textFaint, fontSize: 11.5 },
  resultTitle: { color: '#8AB4F8', fontSize: 16, marginTop: 2 },
  resultSnippet: { color: theme.colors.textDim, fontSize: 13, lineHeight: 18, marginTop: 3 },

  imageRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  imageCell: { width: 104, height: 104, borderRadius: 10, backgroundColor: theme.colors.surfaceHigh },

  // ---- fictional news site ----
  siteMast: {
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: theme.colors.border,
    paddingBottom: 12,
    marginBottom: 16,
  },
  siteName: { color: theme.colors.text, fontSize: 24, fontWeight: '900', letterSpacing: 0.5, textAlign: 'center' },
  siteTag: { color: theme.colors.textFaint, fontSize: 11, marginTop: 3, letterSpacing: 1.5, textTransform: 'uppercase' },
  articleHeadline: { color: theme.colors.text, fontSize: 22, fontWeight: '800', lineHeight: 29 },
  articleMeta: { color: theme.colors.textFaint, fontSize: 12.5, marginTop: 8, marginBottom: 14 },
  articleImage: { height: 180, borderRadius: theme.radius.sm, marginBottom: 14, backgroundColor: theme.colors.surfaceHigh },
  articlePara: { color: theme.colors.textDim, fontSize: 15.5, lineHeight: 24, marginBottom: 14 },
  articleFoot: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.border,
    paddingTop: 12,
    marginTop: 6,
  },
  articleFootText: { color: theme.colors.textFaint, fontSize: 11.5, textAlign: 'center' },
});
