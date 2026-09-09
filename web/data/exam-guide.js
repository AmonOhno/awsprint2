/* AWS Study — SAA 試験ガイド閲覧データ(単一ソース)
 * 出典: AWS 公式「AWS Certified Solutions Architect – Associate (SAA-C03) 試験ガイド」
 *   https://docs.aws.amazon.com/aws-certification/latest/solutions-architect-associate-03/solutions-architect-associate-03.html
 * 本文を要点整理して日本語でまとめたもの。公式の最新版・原文は上記URLで必ず確認すること。
 *
 * 本文中の [[termId|表示テキスト]](または [[termId]])は「覚えておくべき用語」の印。
 * app.js がこれをクリック可能なチップに変換し、GLOSSARY の説明をダイアログで表示する。
 */
window.EXAM_GUIDE = {
  meta: {
    title: "AWS Certified Solutions Architect – Associate",
    code: "SAA-C03",
    updatedNote: "本ページは公式試験ガイドの要点まとめです。受験前に必ず公式の最新版を確認してください。",
    sourceUrl:
      "https://docs.aws.amazon.com/aws-certification/latest/solutions-architect-associate-03/solutions-architect-associate-03.html",
    facts: [
      { label: "問題数", value: "65 問(うち採点対象外 15 問)" },
      { label: "試験時間", value: "130 分" },
      { label: "合格スコア", value: "720 / 1000(最低合格点)" },
      { label: "出題形式", value: "択一選択 / 複数選択" },
      { label: "受験料", value: "150 USD(参考・変動あり)" },
    ],
  },

  // 用語集: 本文の [[id]] からダイアログで参照される
  glossary: {
    "well-architected": {
      term: "AWS Well-Architected Framework",
      reading: "ウェルアーキテクテッド フレームワーク",
      desc:
        "優れたクラウド設計の原則をまとめた指針。運用上の優秀性・セキュリティ・信頼性・パフォーマンス効率・コスト最適化・持続可能性の6本柱で構成される。SAA はこのフレームワークに沿った設計判断ができるかを問う。",
    },
    "compensatory-scoring": {
      term: "補正採点方式 (Compensatory scoring)",
      reading: "ほせいさいてん",
      desc:
        "分野ごとの合格ラインは設けず、試験全体の合計スコアで合否を判定する方式。ある分野が弱くても他分野で補える。ただし全分野を満遍なく学習することが推奨される。",
    },
    "scaled-score": {
      term: "スケールドスコア (100〜1000)",
      reading: "",
      desc:
        "素点(正解数)を統計的に変換した換算スコア。問題の難易度差を吸収するため、正解数そのものではなく 100〜1000 の尺度で表される。SAA の合格点は 720。",
    },
    iam: {
      term: "AWS IAM (Identity and Access Management)",
      reading: "アイアム",
      desc:
        "誰が(プリンシパル)どのリソースに何をできるかを制御する認証・認可サービス。ユーザー/グループ/ロール/ポリシーで最小権限を実現する。長期キーよりも一時的な認証情報(ロール)が推奨。",
    },
    "iam-role": {
      term: "IAM ロール",
      reading: "",
      desc:
        "一時的な認証情報を発行できる「なりすまし可能な権限のセット」。EC2 や Lambda、他アカウント、フェデレーションユーザーに権限を渡す標準手段。アクセスキーの埋め込みを避けられる。",
    },
    "iam-identity-center": {
      term: "AWS IAM Identity Center (旧 AWS SSO)",
      reading: "",
      desc:
        "複数の AWS アカウントや業務アプリへのシングルサインオンを一元管理するサービス。外部 IdP(Active Directory 等)と連携し、一時認証でアクセスを付与する。",
    },
    organizations: {
      term: "AWS Organizations",
      reading: "オーガニゼーションズ",
      desc:
        "複数 AWS アカウントを組織単位(OU)でまとめて統制・一括請求するサービス。SCP でアカウント横断のガードレールを敷ける。",
    },
    scp: {
      term: "SCP (サービスコントロールポリシー)",
      reading: "",
      desc:
        "AWS Organizations でアカウント/OU に適用する「許可の上限(ガードレール)」。IAM でどんな権限を付けても SCP で拒否された操作は実行できない。権限を付与するのではなく制限する点に注意。",
    },
    "security-group": {
      term: "セキュリティグループ",
      reading: "",
      desc:
        "EC2 などインスタンス単位に付くステートフルなファイアウォール。許可ルールのみを書き、戻りの通信は自動で許可される。拒否ルールは書けない。",
    },
    nacl: {
      term: "ネットワーク ACL (NACL)",
      reading: "ナクル",
      desc:
        "サブネット単位に付くステートレスなファイアウォール。許可・拒否の両方を番号順に評価し、戻りの通信も明示的に許可が必要。セキュリティグループより広い範囲を制御する。",
    },
    waf: {
      term: "AWS WAF",
      reading: "ワフ",
      desc:
        "HTTP/HTTPS のレイヤー7を保護する Web アプリケーションファイアウォール。SQL インジェクションや XSS、レート制限などのルールを CloudFront・ALB・API Gateway に適用する。",
    },
    shield: {
      term: "AWS Shield",
      reading: "シールド",
      desc:
        "DDoS 攻撃からの保護サービス。Standard は無料で自動適用。Advanced は有償で、より高度な防御・専門チーム支援・コスト保護を提供する。",
    },
    guardduty: {
      term: "Amazon GuardDuty",
      reading: "ガードデューティ",
      desc:
        "ログ(VPC フローログ・CloudTrail・DNS 等)を機械学習で分析し、脅威や不審な挙動を継続検知するサービス。エージェント不要で有効化するだけで動く。",
    },
    kms: {
      term: "AWS KMS (Key Management Service)",
      reading: "ケーエムエス",
      desc:
        "暗号鍵の生成・管理・アクセス制御を行うマネージドサービス。S3・EBS・RDS など多くのサービスの保存時暗号化に利用され、鍵の使用は IAM とキーポリシーで制御する。",
    },
    "cloudhsm": {
      term: "AWS CloudHSM",
      reading: "クラウドエイチエスエム",
      desc:
        "専有のハードウェアセキュリティモジュール(HSM)を提供するサービス。鍵を自社だけで完全に管理したい、厳格なコンプライアンス要件がある場合に KMS の代わりに検討する。",
    },
    acm: {
      term: "AWS Certificate Manager (ACM)",
      reading: "エーシーエム",
      desc:
        "SSL/TLS 証明書を発行・自動更新するサービス。ELB・CloudFront・API Gateway に紐付けて HTTPS 通信を実現する。パブリック証明書は無料。",
    },
    "secrets-manager": {
      term: "AWS Secrets Manager",
      reading: "シークレッツ マネージャー",
      desc:
        "DB パスワードや API キーなどの機密情報を安全に保管し、自動ローテーションできるサービス。アプリはコードに秘密を埋め込まず API 経由で取得する。",
    },
    "encryption-at-rest": {
      term: "保存時の暗号化 (Encryption at rest)",
      reading: "",
      desc:
        "ディスクやストレージに保存されたデータを暗号化すること。S3・EBS・RDS などは KMS 連携で有効化できる。対になる概念が「転送時の暗号化(TLS)」。",
    },
    "least-privilege": {
      term: "最小権限の原則",
      reading: "さいしょうけんげん",
      desc:
        "タスクの遂行に必要な最小限の権限だけを付与する設計原則。過剰な権限を与えないことで侵害時の影響を抑える。SAA のセキュリティ設計の基本。",
    },

    sqs: {
      term: "Amazon SQS",
      reading: "エスキューエス",
      desc:
        "フルマネージドのメッセージキュー。送信側と受信側を疎結合にし、負荷の急増をバッファする。標準キュー(高スループット・順序保証なし)と FIFO キュー(順序・重複排除)がある。",
    },
    sns: {
      term: "Amazon SNS",
      reading: "エスエヌエス",
      desc:
        "パブリッシュ/サブスクライブ型の通知サービス。1つのメッセージを複数の購読先(Lambda・SQS・HTTP・メール等)へ一斉配信するファンアウトに使う。",
    },
    eventbridge: {
      term: "Amazon EventBridge",
      reading: "イベントブリッジ",
      desc:
        "イベント駆動アーキテクチャの中核となるイベントバス。AWS サービスや SaaS のイベントをルールでフィルタし、ターゲットへルーティングする。",
    },
    "loosely-coupled": {
      term: "疎結合 (Loosely coupled)",
      reading: "そけつごう",
      desc:
        "コンポーネント同士の依存を弱め、キューや通知を介して連携させる設計。片方の障害やスケールが他方に波及しにくくなり、可用性と拡張性が高まる。",
    },
    "auto-scaling": {
      term: "Auto Scaling",
      reading: "オートスケーリング",
      desc:
        "負荷に応じて EC2 などの台数を自動で増減させる仕組み。需要増でスケールアウト、減でスケールインし、可用性を保ちつつコストを最適化する。",
    },
    elb: {
      term: "Elastic Load Balancing (ELB)",
      reading: "イーエルビー",
      desc:
        "受信トラフィックを複数のターゲットに分散するロードバランサー。ALB(L7/HTTP)、NLB(L4/超高性能)、GWLB(仮想アプライアンス)があり、AZ をまたいで冗長化する。",
    },
    route53: {
      term: "Amazon Route 53",
      reading: "ルート フィフティスリー",
      desc:
        "権威 DNS サービス。ルーティングポリシー(加重・レイテンシー・位置情報・フェイルオーバー等)とヘルスチェックで、可用性とパフォーマンスを両立した名前解決を実現する。",
    },
    "multi-az": {
      term: "マルチ AZ (Multi-AZ)",
      reading: "マルチ エージー",
      desc:
        "複数のアベイラビリティゾーンにリソースを分散配置する構成。1つの AZ 障害でもサービスを継続できる高可用性設計の基本。RDS のマルチ AZ は同期レプリカへ自動フェイルオーバーする。",
    },
    az: {
      term: "アベイラビリティゾーン (AZ)",
      reading: "",
      desc:
        "リージョン内の、電源・ネットワークが独立した1つ以上のデータセンター群。AZ 間は低レイテンシーで接続され、複数 AZ 利用が耐障害設計の前提となる。",
    },
    region: {
      term: "リージョン",
      reading: "",
      desc:
        "地理的に分離した AWS の拠点。複数の AZ で構成される。データ所在地(コンプライアンス)やレイテンシー、対象サービスの提供有無で選定する。",
    },
    rpo: {
      term: "RPO (目標復旧時点)",
      reading: "アールピーオー",
      desc:
        "障害時にどこまでのデータ損失を許容できるかを示す指標。「何分前の状態まで戻せればよいか」。小さいほど頻繁なバックアップ/レプリケーションが必要でコストも上がる。",
    },
    rto: {
      term: "RTO (目標復旧時間)",
      reading: "アールティーオー",
      desc:
        "障害発生から復旧までに許容できる時間の指標。「どれだけ早く復旧させる必要があるか」。小さいほど高度な DR 構成(ホットスタンバイ等)が必要になる。",
    },
    "fault-tolerant": {
      term: "フォールトトレラント (耐障害性)",
      reading: "",
      desc:
        "構成要素の一部が壊れても、サービス全体は停止せず機能し続ける設計特性。冗長化と自動フェイルオーバーで実現する。「高可用性」より強い、無停止に近い概念。",
    },

    ec2: {
      term: "Amazon EC2",
      reading: "イーシーツー",
      desc:
        "仮想サーバーを必要な分だけ起動できるコンピューティングサービス。インスタンスタイプ(汎用/コンピューティング最適化/メモリ最適化 等)を用途に合わせて選ぶ。",
    },
    lambda: {
      term: "AWS Lambda",
      reading: "ラムダ",
      desc:
        "サーバー管理不要でコードを実行するサーバーレスコンピューティング。イベントに応じて自動スケールし、実行時間・回数に対してのみ課金される。",
    },
    fargate: {
      term: "AWS Fargate",
      reading: "ファーゲート",
      desc:
        "ECS/EKS 用のサーバーレスコンテナ実行基盤。EC2 インスタンスの管理なしにコンテナを動かせ、必要リソース分だけ支払う。",
    },
    ecs: {
      term: "Amazon ECS",
      reading: "イーシーエス",
      desc:
        "AWS ネイティブのコンテナオーケストレーションサービス。EC2 または Fargate 上でコンテナを実行・管理する。",
    },
    eks: {
      term: "Amazon EKS",
      reading: "イーケーエス",
      desc:
        "マネージドな Kubernetes サービス。既存の Kubernetes エコシステムやマルチクラウドを重視する場合に選ぶ。",
    },
    s3: {
      term: "Amazon S3",
      reading: "エススリー",
      desc:
        "耐久性 99.999999999%(イレブンナイン)のオブジェクトストレージ。静的コンテンツ・バックアップ・データレイクの基盤。ストレージクラスとライフサイクルでコスト最適化する。",
    },
    "s3-storage-classes": {
      term: "S3 ストレージクラス",
      reading: "",
      desc:
        "アクセス頻度に応じた保存プラン群。Standard / Standard-IA / One Zone-IA / Glacier 各種などがあり、アクセスが減るほど保存料が安く取り出しコストが上がる。",
    },
    "s3-intelligent-tiering": {
      term: "S3 Intelligent-Tiering",
      reading: "インテリジェント ティアリング",
      desc:
        "アクセスパターンを自動監視し、最適なアクセス階層へデータを自動移動するストレージクラス。アクセス頻度が読めないデータのコスト最適化に有効。",
    },
    "s3-lifecycle": {
      term: "S3 ライフサイクルポリシー",
      reading: "",
      desc:
        "オブジェクトの経過日数に応じて、別のストレージクラスへ移行(遷移)したり削除(有効期限)したりするルール。古いデータを自動でアーカイブしコストを下げる。",
    },
    ebs: {
      term: "Amazon EBS",
      reading: "イービーエス",
      desc:
        "EC2 にアタッチするブロックストレージ(仮想ディスク)。gp3/io2 等のボリュームタイプで性能を選ぶ。基本は単一 AZ で、スナップショットは S3 に保存される。",
    },
    efs: {
      term: "Amazon EFS",
      reading: "イーエフエス",
      desc:
        "複数の EC2/コンテナから同時マウントできる、フルマネージドな共有ファイルストレージ(NFS)。複数 AZ で自動冗長化され、容量は自動伸縮する(Linux 向け)。",
    },
    fsx: {
      term: "Amazon FSx",
      reading: "エフエスエックス",
      desc:
        "業界標準のファイルシステムをマネージド提供。FSx for Windows File Server(SMB)、FSx for Lustre(高性能計算)など、要件に応じて選ぶ。",
    },
    rds: {
      term: "Amazon RDS",
      reading: "アールディーエス",
      desc:
        "マネージドなリレーショナルDB(MySQL・PostgreSQL・SQL Server 等)。パッチ・バックアップ・マルチ AZ フェイルオーバーを自動化する。リードレプリカで読み取りを拡張。",
    },
    aurora: {
      term: "Amazon Aurora",
      reading: "オーロラ",
      desc:
        "AWS 製の高性能な MySQL/PostgreSQL 互換DB。ストレージが3 AZ に6重複製され自動修復、最大15のリードレプリカ、Serverless 版で自動スケールも可能。",
    },
    dynamodb: {
      term: "Amazon DynamoDB",
      reading: "ダイナモDB",
      desc:
        "フルマネージドな NoSQL(キーバリュー/ドキュメント)DB。1桁ミリ秒の応答と自動スケールを提供。オンデマンド/プロビジョンド課金、グローバルテーブルで多リージョン展開。",
    },
    elasticache: {
      term: "Amazon ElastiCache",
      reading: "エラスティキャッシュ",
      desc:
        "Redis/Memcached のインメモリキャッシュをマネージド提供。DB の前段に置いて読み取り負荷を下げ、レイテンシーを短縮する。",
    },

    cloudfront: {
      term: "Amazon CloudFront",
      reading: "クラウドフロント",
      desc:
        "世界中のエッジロケーションでコンテンツをキャッシュ配信する CDN。オリジンの負荷とレイテンシーを下げ、WAF や TLS と組み合わせて保護も担う。",
    },
    "global-accelerator": {
      term: "AWS Global Accelerator",
      reading: "グローバル アクセラレータ",
      desc:
        "固定のエニーキャスト IP から、AWS のグローバルネットワーク経由で最適なリージョンへトラフィックを誘導するサービス。非 HTTP を含むアプリの可用性・レイテンシーを改善する。",
    },
    vpc: {
      term: "Amazon VPC",
      reading: "ブイピーシー",
      desc:
        "AWS 上に構築する論理的に隔離された仮想ネットワーク。サブネット・ルートテーブル・ゲートウェイで通信を設計し、セキュリティグループ/NACL で保護する。",
    },
    "vpc-endpoint": {
      term: "VPC エンドポイント",
      reading: "",
      desc:
        "VPC から AWS サービスへ、インターネットを経由せず接続する入口。ゲートウェイ型(S3・DynamoDB)とインターフェース型(PrivateLink)がある。セキュリティと安定性が向上する。",
    },
    "direct-connect": {
      term: "AWS Direct Connect",
      reading: "ダイレクト コネクト",
      desc:
        "オンプレミスと AWS を専用線で接続するサービス。インターネットを経由せず、安定した低レイテンシーと高帯域を得られる。VPN より高価だが品質が高い。",
    },
    "site-to-site-vpn": {
      term: "AWS Site-to-Site VPN",
      reading: "",
      desc:
        "オンプレミスと VPC を暗号化トンネル(IPsec)でインターネット越しに接続するサービス。Direct Connect より安価で早く構築でき、冗長化やバックアップ経路にも使う。",
    },
    "transit-gateway": {
      term: "AWS Transit Gateway",
      reading: "トランジット ゲートウェイ",
      desc:
        "多数の VPC やオンプレミスを1点でハブ&スポーク接続するルーター。VPC ピアリングが増えて複雑化する網の目構成を集約・簡素化する。",
    },

    "savings-plans": {
      term: "Savings Plans",
      reading: "セービングス プランズ",
      desc:
        "1年または3年の一定利用量(1時間あたりの$コミット)を約束する代わりに、EC2・Fargate・Lambda 料金を割引する購入方式。オンデマンドより最大数割安い。",
    },
    "reserved-instances": {
      term: "リザーブドインスタンス (RI)",
      reading: "",
      desc:
        "特定条件のインスタンスを1〜3年予約して割引を得る購入方式。定常的に稼働し続けるワークロードのコスト最適化に使う。",
    },
    "spot-instances": {
      term: "スポットインスタンス",
      reading: "",
      desc:
        "AWS の余剰キャパシティを最大9割引で使える EC2。中断される可能性があるため、停止に強いバッチ処理やステートレスな並列処理に向く。",
    },
    "cost-explorer": {
      term: "AWS Cost Explorer",
      reading: "コスト エクスプローラー",
      desc:
        "利用料金とコスト傾向を可視化・分析するツール。将来予測や RI/Savings Plans の推奨も提示し、コスト最適化の意思決定を支える。",
    },
    kinesis: {
      term: "Amazon Kinesis",
      reading: "キネシス",
      desc:
        "ストリーミングデータをリアルタイムに収集・処理するサービス群(Data Streams / Firehose 等)。ログ・クリックストリーム・IoT データの取り込みに使う。",
    },
    athena: {
      term: "Amazon Athena",
      reading: "アテナ",
      desc:
        "S3 上のデータに対して標準 SQL で直接クエリするサーバーレス分析サービス。事前のロードやサーバー管理が不要で、スキャン量に応じた課金。",
    },
    glue: {
      term: "AWS Glue",
      reading: "グルー",
      desc:
        "サーバーレスの ETL(抽出・変換・ロード)サービス。データカタログでスキーマを管理し、分析用にデータを整形・統合する。",
    },
  },

  // 本文セクション
  sections: [
    {
      id: "intro",
      title: "はじめに(試験の概要)",
      blocks: [
        {
          type: "p",
          text:
            "AWS Certified Solutions Architect – Associate (SAA-C03) 試験は、ソリューションアーキテクトの役割を担う人を対象とする。[[well-architected]] に沿って、安全で・回復力があり・高性能で・コスト最適化された設計を行える能力を検証する。",
        },
        {
          type: "p",
          text: "この試験では、受験者が次のことをできるかを問う。",
        },
        {
          type: "ul",
          items: [
            "現在の要件と将来の需要を満たすよう、AWS サービスを組み合わせたソリューションを設計する",
            "セキュア・回復力・高性能・コスト最適の観点でアーキテクチャを設計する",
            "既存のソリューションをレビューし、改善点を判断する",
          ],
        },
      ],
    },
    {
      id: "candidate",
      title: "対象となる受験者",
      blocks: [
        {
          type: "p",
          text:
            "AWS サービスを用いたクラウドソリューションの設計について、1年以上の実務経験を持つ人が対象とされる。次のような知識が推奨される。",
        },
        {
          type: "ul",
          items: [
            "AWS のコンピューティング・ネットワーキング・ストレージ・データベースの各サービス",
            "AWS のデプロイ/管理サービスとツール",
            "[[well-architected]] のベストプラクティスとセキュリティのベストプラクティス",
            "[[region]]・[[az]] など AWS グローバルインフラの構造",
            "AWS のネットワーキング技術と、サービス同士の接続方法",
            "料金体系と [[cost-explorer|コスト最適化]] の考え方",
          ],
        },
        {
          type: "p",
          text:
            "一方、次は受験者に求められない(試験範囲外の役割)。ソフトウェアコードの記述、CI/CD パイプラインの設計、複雑なネットワーク(BGP 等)の実装 など。",
        },
      ],
    },
    {
      id: "exam-format",
      title: "試験の形式と採点",
      blocks: [
        {
          type: "p",
          text:
            "出題形式は2種類。「択一選択(4つの選択肢から正解1つ)」と「複数選択(5つ以上から正解2つ以上)」。誤答による減点はないため、分からない問題も必ず回答するとよい。",
        },
        {
          type: "p",
          text:
            "全 65 問のうち 15 問は採点対象外(将来問題の評価用)で、どれが対象外かは受験者に分からない。合否は残り 50 問で決まる。",
        },
        {
          type: "p",
          text:
            "スコアは [[scaled-score|100〜1000 のスケールドスコア]] で表され、合格ラインは 720。合否は [[compensatory-scoring|補正採点方式]] で、分野別の合格ラインはなく試験全体の合計で判定される。",
        },
      ],
    },
    {
      id: "domains",
      title: "出題分野と比重",
      blocks: [
        {
          type: "p",
          text:
            "試験は4つの分野で構成され、それぞれに採点比重(重み)がある。各分野は「タスクステートメント」に分かれ、設計判断の観点を示す。",
        },
        {
          type: "domain",
          num: 1,
          title: "セキュアなアーキテクチャの設計",
          weight: 30,
          tasks: [
            {
              t: "1.1 AWS リソースへのセキュアなアクセスを設計する",
              detail:
                "[[iam]] のユーザー/グループ/[[iam-role|ロール]]/ポリシーで [[least-privilege|最小権限]] を実現。[[iam-identity-center]]・[[organizations]]・[[scp]] でマルチアカウント統制を設計する。",
            },
            {
              t: "1.2 セキュアなワークロードとアプリケーションを設計する",
              detail:
                "[[security-group]]・[[nacl]] でネットワークを保護し、[[waf]]・[[shield]]・[[guardduty]] で脅威に備える。[[secrets-manager]] で機密情報を管理する。",
            },
            {
              t: "1.3 適切なデータセキュリティ制御を判断する",
              detail:
                "[[kms]](必要なら [[cloudhsm]])による [[encryption-at-rest|保存時暗号化]] と、[[acm]] を用いた転送時暗号化(TLS)を設計する。",
            },
          ],
        },
        {
          type: "domain",
          num: 2,
          title: "回復力のあるアーキテクチャの設計",
          weight: 26,
          tasks: [
            {
              t: "2.1 スケーラブルで疎結合なアーキテクチャを設計する",
              detail:
                "[[sqs]]・[[sns]]・[[eventbridge]] で [[loosely-coupled|疎結合]] にし、[[auto-scaling]]・[[elb]] で需要変動に追従させる。",
            },
            {
              t: "2.2 高可用性・耐障害性のあるアーキテクチャを設計する",
              detail:
                "[[multi-az]] 配置と [[route53]] のフェイルオーバーで可用性を確保。バックアップと DR を [[rpo]]・[[rto]] の要件から設計し、[[fault-tolerant|耐障害性]]を高める。",
            },
          ],
        },
        {
          type: "domain",
          num: 3,
          title: "高性能なアーキテクチャの設計",
          weight: 24,
          tasks: [
            {
              t: "3.1 高性能・スケーラブルなストレージを判断する",
              detail:
                "[[s3]]・[[ebs]]・[[efs]]・[[fsx]] を用途(オブジェクト/ブロック/共有ファイル)で選び分ける。",
            },
            {
              t: "3.2 高性能で伸縮するコンピューティングを設計する",
              detail:
                "[[ec2]] のインスタンス選定、[[lambda]]・[[fargate]] のサーバーレス、[[auto-scaling]] を組み合わせる。",
            },
            {
              t: "3.3 高性能なデータベースを判断する",
              detail:
                "[[rds]]・[[aurora]]・[[dynamodb]] を要件で選び、[[elasticache]] で読み取りを高速化する。",
            },
            {
              t: "3.4 高性能・スケーラブルなネットワークを判断する",
              detail:
                "[[cloudfront]]・[[global-accelerator]] でレイテンシーを短縮し、[[vpc-endpoint]]・[[transit-gateway]] で接続を最適化する。",
            },
            {
              t: "3.5 高性能なデータ取り込み・変換を判断する",
              detail:
                "[[kinesis]] でストリーミングを取り込み、[[glue]]・[[athena]] で変換・分析する。",
            },
          ],
        },
        {
          type: "domain",
          num: 4,
          title: "コスト最適化されたアーキテクチャの設計",
          weight: 20,
          tasks: [
            {
              t: "4.1 コスト最適なストレージを設計する",
              detail:
                "[[s3-storage-classes]]・[[s3-intelligent-tiering]]・[[s3-lifecycle]] でデータのライフサイクルに沿って費用を下げる。",
            },
            {
              t: "4.2 コスト最適なコンピューティングを設計する",
              detail:
                "[[savings-plans]]・[[reserved-instances]]・[[spot-instances]] を稼働特性に合わせて使い分ける。",
            },
            {
              t: "4.3 コスト最適なデータベースを設計する",
              detail:
                "[[aurora|Aurora Serverless]] や [[dynamodb|DynamoDB オンデマンド]] など、負荷に応じた課金モデルを選ぶ。",
            },
            {
              t: "4.4 コスト最適なネットワークを設計する",
              detail:
                "データ転送料を意識し、[[vpc-endpoint]] や [[cloudfront]] で不要な転送・NAT コストを削減する。[[cost-explorer]] で継続的に可視化する。",
            },
          ],
        },
      ],
    },
    {
      id: "services",
      title: "試験範囲の主要サービス",
      blocks: [
        {
          type: "p",
          text:
            "試験ガイドは範囲内サービスをカテゴリ別に列挙している。代表的なものを挙げる(用語をタップで説明が開く)。",
        },
        {
          type: "services",
          groups: [
            {
              name: "コンピューティング / コンテナ / サーバーレス",
              terms: ["ec2", "auto-scaling", "lambda", "ecs", "eks", "fargate"],
            },
            {
              name: "ストレージ",
              terms: ["s3", "ebs", "efs", "fsx", "s3-storage-classes", "s3-lifecycle"],
            },
            {
              name: "データベース",
              terms: ["rds", "aurora", "dynamodb", "elasticache"],
            },
            {
              name: "ネットワーキング / 配信",
              terms: [
                "vpc",
                "route53",
                "elb",
                "cloudfront",
                "global-accelerator",
                "vpc-endpoint",
                "direct-connect",
                "site-to-site-vpn",
                "transit-gateway",
              ],
            },
            {
              name: "セキュリティ / ID / コンプライアンス",
              terms: [
                "iam",
                "iam-identity-center",
                "organizations",
                "scp",
                "kms",
                "cloudhsm",
                "acm",
                "secrets-manager",
                "waf",
                "shield",
                "guardduty",
              ],
            },
            {
              name: "アプリ統合 / 分析",
              terms: ["sqs", "sns", "eventbridge", "kinesis", "athena", "glue"],
            },
            {
              name: "コスト管理",
              terms: ["savings-plans", "reserved-instances", "spot-instances", "cost-explorer"],
            },
          ],
        },
        {
          type: "p",
          text:
            "この一覧は要点であり、公式ガイドには範囲外サービスの明記や補足がある。受験前に必ず公式の最新版で全文を確認すること。",
        },
      ],
    },
  ],
};
