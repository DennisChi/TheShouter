module.exports = {
    resolve: {
        fallback: {
            util: require.resolve("util/"),
            os: require.resolve("os-browserify/browser"),
            stream: require.resolve("stream-browserify"),
            crypto: require.resolve("crypto-browserify")
        }
    }
};
